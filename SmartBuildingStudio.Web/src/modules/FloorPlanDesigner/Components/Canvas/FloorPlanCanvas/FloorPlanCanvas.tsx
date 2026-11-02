// src/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/FloorPlanCanvas.tsx

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useCanvasPan } from '@/modules/FloorPlanDesigner/Hooks/useCanvasPan';
import { useCanvasZoom } from '@/modules/FloorPlanDesigner/Hooks/useCanvasZoom';
import { CanvasRenderer } from '@/modules/FloorPlanDesigner/Components/Canvas/CanvasRenderer';
import { useFloorPlanFetching } from '@/modules/FloorPlanDesigner/Hooks/UseFloorPlanFetching';
import { usePlanRenderer } from '@/modules/FloorPlanDesigner/Hooks/usePlanRenderer';
import type { ArchitecturalPlan } from '@/modules/FloorPlanDesigner/core/types';
import { useAppSelector, useAppDispatch } from '@/Application/ConfigureStore';
import { WallTool } from '@/modules/FloorPlanDesigner/Tools/WallTool';
import { RoomTool } from '@/modules/FloorPlanDesigner/Tools/RoomTool';
import { DoorTool } from '@/modules/FloorPlanDesigner/Tools/DoorTool';
import { WindowTool } from '@/modules/FloorPlanDesigner/Tools/WindowTool';
import { MeasurementRulerTool } from '@/modules/FloorPlanDesigner/Tools/MeasurementRulerTool';
import { CalibrationRulerTool } from '@/modules/FloorPlanDesigner/Tools/CalibrationRulerTool';
import type { SnapResult } from '@/modules/FloorPlanDesigner/Utils/SnapService';
import { CommandManager } from '@/modules/FloorPlanDesigner/Commands/CommandManager';
import FloorPlanSnapHook from '@/modules/FloorPlanDesigner/Utils/FloorPlanSnapHook';
import {
  setLayerVisibility,
  setHoveredId as setHoveredIdAction,
} from '@/modules/FloorPlanDesigner/Store/FloorPlanSlice';
import { useZoomSurface } from '@/modules/Shared/Zoom/zoomRegistry';
import type { ZoomableSurface, WorldRect } from '@/modules/Shared/Zoom/zoomSurface';
import { usePanMode } from '@/modules/Shared/Zoom/panMode';

import type {
  FloorPlanCanvasProps,
  CanvasTransform,
} from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/types';
import {
  DEFAULT_LAYERS,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_STEP,
  DOUBLE_CLICK_ZOOM_FILL,
  DOUBLE_CLICK_ZOOM_MAX,
} from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/constants';
import { docSize } from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/utils/geometry';
import { useCanvasReduxBridge } from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/hooks/useCanvasReduxBridge';
import { useCanvasKeyboard } from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/hooks/useCanvasKeyboard';
import { useCanvasRender } from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/hooks/useCanvasRender';
import { useCanvasPointerHandlers } from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/hooks/useCanvasPointerHandlers';

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
  plan,
  activeTool = 'select',
  isReadOnly = false,
  toolManager,
  toolContext,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isLoading, error, activeDocumentState } = useFloorPlanFetching();
  const { offset, setOffset, isPanning, handleMouseDown, handleMouseMove, handleMouseUpOrLeave } = useCanvasPan();
  const { scale, setScale, handleWheel } = useCanvasZoom();
  const dispatch = useAppDispatch();
  const panMode = usePanMode();

  const selection = useAppSelector((s: any) => s.floorPlan?.selection);
  const multiSelection = useAppSelector((s: any) => s.floorPlan?.multiSelection) as string[];
  const floorPlanState = useAppSelector((s: any) => s.floorPlan || {});
  const calibrationState = useAppSelector((s: any) => s.floorPlan?.calibration);
  const hoveredIdFromRedux = useAppSelector((s: any) => s.floorPlan?.hoveredId);
  const reduxDocument = useAppSelector((s: any) => s.floorPlan?.document);
  const reduxLayers = useAppSelector((s: any) => s.floorPlan?.layers);
  const reduxActiveTool = useAppSelector((s: any) => s.floorPlan?.activeTool);

  const transformRef = useRef<CanvasTransform | null>(null);
  const lastFrameDocRef = useRef<string | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoverRafRef = useRef<number | null>(null);
  const pendingHoverPointRef = useRef<{ x: number; y: number } | null>(null);

  const dragStartWorldRef = useRef<{ x: number; y: number } | null>(null);
  const dragCurrentWorldRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartScreenRef = useRef<{ x: number; y: number } | null>(null);
  const isDragRectRef = useRef(false);
  const [dragTick, setDragTick] = useState(0);

  const isMiddlePanningRef = useRef(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const isSpacePanningRef = useRef(false);
  const isPanModePanningRef = useRef(false);

  const [snapResult, setSnapResult] = useState<SnapResult | null>(null);

  const wallToolRef = useRef<WallTool | null>(null);
  const roomToolRef = useRef<RoomTool | null>(null);
  const doorToolRef = useRef<DoorTool | null>(null);
  const windowToolRef = useRef<WindowTool | null>(null);
  const measurementRulerToolRef = useRef<MeasurementRulerTool | null>(null);
  const calibrationRulerToolRef = useRef<CalibrationRulerTool | null>(null);

  const [currentTool, setCurrentTool] = useState(reduxActiveTool || activeTool);

  // ── Stable toolContext ref (does NOT retrigger tool recreation) ────
  const toolContextRef = useRef(toolContext);
  useEffect(() => {
    toolContextRef.current = toolContext;
  }, [toolContext]);

  const getActiveToolInstance = useCallback(() => {
    if (currentTool === 'wall') return wallToolRef.current;
    if (currentTool === 'room') return roomToolRef.current;
    if (currentTool === 'door') return doorToolRef.current;
    if (currentTool === 'window') return windowToolRef.current;
    if (currentTool === 'measure') return measurementRulerToolRef.current;
    if (currentTool === 'calibration') return calibrationRulerToolRef.current;
    return null;
  }, [currentTool]);

  const toolManagerKnowsTool = useCallback(
    (toolId: string): boolean => {
      if (!toolManager || !toolId) return false;
      try {
        if (typeof toolManager.getTool === 'function') {
          return !!toolManager.getTool(toolId);
        }
        if (typeof toolManager.getRegisteredToolIds === 'function') {
          return toolManager.getRegisteredToolIds().includes(toolId);
        }
      } catch { /* fall through */ }
      return false;
    },
    [toolManager],
  );

  const commandManagerRef = useRef<CommandManager | null>(
    (window as any).__floorPlanCommandManagerInstance || null,
  );
  if (!commandManagerRef.current) {
    commandManagerRef.current = new CommandManager();
    (window as any).__floorPlanCommandManagerInstance = commandManagerRef.current;
  }

  const layers = useMemo<Record<string, boolean>>(() => {
    const merged: Record<string, boolean> = { ...DEFAULT_LAYERS };
    if (reduxLayers && typeof reduxLayers === 'object') {
      for (const [k, v] of Object.entries(reduxLayers)) {
        if (v !== undefined && v !== null) merged[k] = Boolean(v);
      }
    }
    return merged;
  }, [reduxLayers]);

  useEffect(() => {
    const reduxSize = docSize(reduxDocument);
    const activeSize = docSize(activeDocumentState);
    const agree =
      reduxSize === activeSize && reduxDocument?.id === activeDocumentState?.id;
    console.log('[FloorPlanCanvas] source check', {
      reduxDocId: reduxDocument?.id ?? null,
      reduxSize,
      activeDocId: activeDocumentState?.id ?? null,
      activeSize,
      agree,
    });
  }, [reduxDocument, activeDocumentState]);

  useEffect(() => {
    dispatch(setHoveredIdAction(hoveredId));
  }, [hoveredId, dispatch]);

  useEffect(() => {
    if (activeDocumentState) {
      dispatch(setLayerVisibility({ snap: false }));
    }
  }, [activeDocumentState, dispatch]);

  const zoomSurface = useMemo<ZoomableSurface>(() => ({
    moduleName: 'Floor Plan Designer',
    getZoom: () => scale,
    setZoom: (z: number) => setScale(Math.min(Math.max(z, ZOOM_MIN), ZOOM_MAX)),
    zoomIn: () => setScale((prev: number) => Math.min(prev * ZOOM_STEP, ZOOM_MAX)),
    zoomOut: () => setScale((prev: number) => Math.max(prev / ZOOM_STEP, ZOOM_MIN)),
    fitToContent: () => { setScale(1); setOffset({ x: 0, y: 0 }); },
    zoomToRect: (rect: WorldRect, opts) => {
      const fill = opts?.fill ?? DOUBLE_CLICK_ZOOM_FILL;
      const maxZoom = opts?.maxZoom ?? DOUBLE_CLICK_ZOOM_MAX;
      const minZoom = opts?.minZoom ?? 0.5;
      const tf = transformRef.current;
      if (!tf) return;

      const worldW = Math.max(1e-6, rect.maxX - rect.minX);
      const worldH = Math.max(1e-6, rect.maxY - rect.minY);
      const currentZoom = scale || 1;
      const naturalScaleX = tf.finalScale / currentZoom;
      const naturalScaleY = Math.abs(tf.yScale) / currentZoom;
      if (!Number.isFinite(naturalScaleX) || !Number.isFinite(naturalScaleY)) return;
      if (naturalScaleX <= 0 || naturalScaleY <= 0) return;

      const zoomForW = (tf.width * fill) / (worldW * naturalScaleX);
      const zoomForH = (tf.height * fill) / (worldH * naturalScaleY);
      const rawTarget = Math.min(zoomForW, zoomForH);
      const targetZoom = Math.min(Math.max(rawTarget, minZoom), Math.min(maxZoom, ZOOM_MAX));
      if (!Number.isFinite(targetZoom) || targetZoom <= 0) return;

      const newFinalScale = naturalScaleX * targetZoom;
      const newYScale = CanvasRenderer.flipY ? -newFinalScale : newFinalScale;
      const worldCx = (rect.minX + rect.maxX) / 2;
      const worldCy = (rect.minY + rect.maxY) / 2;
      setScale(targetZoom);
      setOffset({
        x: -(worldCx - tf.centerX) * newFinalScale,
        y: -(worldCy - tf.centerY) * newYScale,
      });
    },
  }), [scale, setScale, setOffset]);

  useZoomSurface(zoomSurface);

  const dataSource = activeDocumentState || plan;
  const renderPlan: ArchitecturalPlan = usePlanRenderer(dataSource, layers);

  // ── Tool creation: depends ONLY on currentTool ────────────────────
  // toolContext is read from a ref, so Redux updates (setDocument,
  // markDirty, etc.) never destroy and recreate the tool mid-flow.
  useEffect(() => {
    [
      wallToolRef,
      roomToolRef,
      doorToolRef,
      windowToolRef,
      measurementRulerToolRef,
      calibrationRulerToolRef,
    ].forEach((ref) => {
      if (ref.current) {
        ref.current.deactivate();
        ref.current = null;
      }
    });
    setSnapResult(null);
    FloorPlanSnapHook.clear();

    const ctx = toolContextRef.current;

    if (currentTool === 'wall') {
      wallToolRef.current = new WallTool();
      wallToolRef.current.activate(ctx);
    } else if (currentTool === 'room') {
      roomToolRef.current = new RoomTool();
      roomToolRef.current.activate(ctx);
    } else if (currentTool === 'door') {
      doorToolRef.current = new DoorTool();
      doorToolRef.current.activate(ctx);
    } else if (currentTool === 'window') {
      windowToolRef.current = new WindowTool();
      windowToolRef.current.activate(ctx);
    } else if (currentTool === 'measure') {
      measurementRulerToolRef.current = new MeasurementRulerTool();
      measurementRulerToolRef.current.activate(ctx);
    } else if (currentTool === 'calibration') {
      calibrationRulerToolRef.current = new CalibrationRulerTool();
      calibrationRulerToolRef.current.activate(ctx);
    }
  }, [currentTool]);

  useEffect(() => setCurrentTool(activeTool), [activeTool]);

  useEffect(() => {
    if (reduxActiveTool && reduxActiveTool !== currentTool) {
      setCurrentTool(reduxActiveTool);
    }
  }, [reduxActiveTool]);

  useEffect(() => {
    if (toolManager && currentTool && toolManagerKnowsTool(currentTool)) {
      try {
        toolManager.activate(currentTool);
      } catch (err) {
        console.warn('[FloorPlanCanvas] toolManager.activate failed:', err);
      }
    }
  }, [currentTool, toolManager, toolManagerKnowsTool]);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const id = e.detail?.id;
      if (id) setCurrentTool(id);
    };
    window.addEventListener('sbs:tool-change', handler as EventListener);
    return () => window.removeEventListener('sbs:tool-change', handler as EventListener);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      handleWheel(e);
    };
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, [handleWheel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prevent = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };
    canvas.addEventListener('mousedown', prevent);
    return () => canvas.removeEventListener('mousedown', prevent);
  }, []);

  const pendingRedrawRef = useRef<number | null>(null);
  useEffect(() => {
    const scheduleRedraw = () => {
      if (pendingRedrawRef.current != null) return;
      pendingRedrawRef.current = requestAnimationFrame(() => {
        pendingRedrawRef.current = null;
        setDragTick((t) => t + 1);
      });
    };
    window.addEventListener('sbs:canvas-update', scheduleRedraw);
    window.addEventListener('canvas-invalidate', scheduleRedraw);
    return () => {
      window.removeEventListener('sbs:canvas-update', scheduleRedraw);
      window.removeEventListener('canvas-invalidate', scheduleRedraw);
      if (pendingRedrawRef.current != null) {
        cancelAnimationFrame(pendingRedrawRef.current);
        pendingRedrawRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (currentTool !== 'select') setHoveredId(null);
  }, [currentTool]);

  useEffect(() => {
    return () => {
      if (hoverRafRef.current != null) {
        cancelAnimationFrame(hoverRafRef.current);
        hoverRafRef.current = null;
      }
    };
  }, []);

  const isGeometryTool =
    currentTool === 'wall' ||
    currentTool === 'room' ||
    currentTool === 'door' ||
    currentTool === 'window';
  const isOverlayTool =
    currentTool === 'measure' ||
    currentTool === 'calibration' ||
    currentTool === 'split-wall';
  const isDrawingTool = isGeometryTool || isOverlayTool;

  const cursorStyle = useMemo(() => {
    if (
      isMiddlePanningRef.current ||
      isSpacePanningRef.current ||
      isPanModePanningRef.current
    ) return 'grabbing';
    if (panMode || isSpaceDown) return 'grab';
    if (isPanning) return 'grabbing';
    if (isReadOnly) return 'default';
    if (isDrawingTool) return 'crosshair';
    if (currentTool === 'select' && hoveredId) return 'pointer';
    return currentTool === 'select' ? 'crosshair' : 'grab';
  }, [currentTool, isPanning, hoveredId, isSpaceDown, panMode, isReadOnly, isDrawingTool]);

  useCanvasReduxBridge({ floorPlanState, layers });

  useCanvasKeyboard({
    isReadOnly,
    currentTool,
    getActiveToolInstance,
    toolManager,
    toolManagerKnowsTool,
    setIsSpaceDown,
    handleMouseUpOrLeave,
    isSpacePanningRef,
  });

  useCanvasRender({
    canvasRef,
    transformRef,
    renderPlan,
    dataSource,
    scale,
    offset,
    selection,
    multiSelection,
    layers,
    snapResult,
    hoveredId,
    hoveredIdFromRedux,
    calibrationState,
    currentTool,
    dragTick,
    isDragRectRef,
    dragStartWorldRef,
    dragCurrentWorldRef,
    lastFrameDocRef,
    getActiveToolInstance,
    toolManager,
    toolContext,
    toolManagerKnowsTool,
  });

  const pointerHandlers = useCanvasPointerHandlers({
    canvasRef,
    transformRef,
    renderPlan,
    layers,
    isPanning,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
    isMiddlePanningRef,
    isSpacePanningRef,
    isPanModePanningRef,
    isSpaceDown,
    panMode,
    dragStartWorldRef,
    dragCurrentWorldRef,
    isDragRectRef,
    dragStartScreenRef,
    setDragTick,
    hoveredId,
    setHoveredId,
    hoverRafRef,
    pendingHoverPointRef,
    setSnapResult,
    currentTool,
    isDrawingTool,
    isReadOnly,
    getActiveToolInstance,
    toolManager,
    toolContext,
    toolManagerKnowsTool,
    zoomSurface,
  });

  if (isLoading && !plan) {
    return (
      <div style={{ color: '#05FFC4', fontFamily: 'monospace', padding: '16px' }}>
        📡 Loading schematics...
      </div>
    );
  }
  if (error && !plan) {
    return (
      <div style={{ color: '#EF4444', fontFamily: 'monospace', padding: '16px' }}>
        ❌ System Error: {error}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '1024px' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={pointerHandlers.handlePointerDown}
        onMouseMove={pointerHandlers.handlePointerMove}
        onMouseUp={pointerHandlers.handlePointerUp}
        onMouseLeave={pointerHandlers.handleMouseLeave}
        onDoubleClick={pointerHandlers.handleDoubleClick}
        onContextMenu={pointerHandlers.handleContextMenu}
        style={{
          border: '1px solid #1E293B',
          display: 'block',
          cursor: cursorStyle,
          backgroundColor: '#0a0a0a',
          borderRadius: '8px',
          imageRendering: 'pixelated',
          pointerEvents: 'auto',
        }}
      />
    </div>
  );
};

export default FloorPlanCanvas;