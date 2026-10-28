// src/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas.tsx

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useCanvasPan } from '@/modules/FloorPlanDesigner/Hooks/useCanvasPan';
import { useCanvasZoom } from '@/modules/FloorPlanDesigner/Hooks/useCanvasZoom';
import { CanvasRenderer } from '@/modules/FloorPlanDesigner/Components/Canvas/CanvasRenderer';
import { useFloorPlanFetching } from '@/modules/FloorPlanDesigner/Hooks/UseFloorPlanFetching';
import { usePlanRenderer } from '@/modules/FloorPlanDesigner/Hooks/usePlanRenderer';
import type { ArchitecturalPlan } from '@/modules/FloorPlanDesigner/core/types';
import { getClosedLockPoint } from '@/modules/FloorPlanDesigner/core/types/Door.types';
import { useAppSelector, useAppDispatch } from '@/Application/ConfigureStore';
import { WallTool } from '@/modules/FloorPlanDesigner/Tools/WallTool';
import { RoomTool } from '@/modules/FloorPlanDesigner/Tools/RoomTool';
import { DoorTool } from '@/modules/FloorPlanDesigner/Tools/DoorTool';
import { WindowTool } from '@/modules/FloorPlanDesigner/Tools/WindowTool';
import { MeasurementRulerTool } from '@/modules/FloorPlanDesigner/Tools/MeasurementRulerTool';
import { CalibrationRulerTool } from '@/modules/FloorPlanDesigner/Tools/CalibrationRulerTool';
import { SnapService, SnapResult } from '@/modules/FloorPlanDesigner/Utils/SnapService';
import { CommandManager } from '@/modules/FloorPlanDesigner/Commands/CommandManager';
import FloorPlanSnapHook from '@/modules/FloorPlanDesigner/Utils/FloorPlanSnapHook';
import {
  setLayerVisibility,
  setDocument,
  setMultiSelection,
  clearMultiSelection,
  setHoveredId as setHoveredIdAction,
} from '@/modules/FloorPlanDesigner/Store/FloorPlanSlice';
import {
  hitTestElements,
  hitTestRectWindow,
  hitTestRectCrossing,
  Rect,
} from '@/modules/FloorPlanDesigner/Utils/HitTest';
import { useZoomSurface } from '@/modules/Shared/Zoom/zoomRegistry';
import type { ZoomableSurface, WorldRect } from '@/modules/Shared/Zoom/zoomSurface';
import { usePanMode } from '@/modules/Shared/Zoom/panMode';

import { LayerManager } from '@/modules/FloorPlanDesigner/Canvas/LayerManager';
import { RenderContext } from '@/modules/FloorPlanDesigner/Canvas/RenderContext';

interface FloorPlanCanvasProps {
  plan?: any;
  activeTool?: string;
  isReadOnly?: boolean;
}

const DEFAULT_LAYERS: Record<string, boolean> = {
  grid: true,
  importedDrawing: true,
  rooms: true,
  walls: true,
  doors: true,
  windows: true,
  rawgeometry: false,
  measurements: true,
  calibration: true,
  snap: false,
  selection: true,
  preview: true,
  exitRoutes: false,
};

const TOOL_TO_LAYER_KEY: Record<string, string | null> = {
  door: 'doors',
  wall: 'walls',
  window: 'windows',
  room: 'rooms',
  select: null,
  pan: null,
  measure: null,
  calibration: null,
};

const HIT_TEST_TOLERANCE_PX = 8;
const DRAG_DEAD_ZONE_PX = 4;
const MOUSE_LEFT = 0;
const MOUSE_MIDDLE = 1;
const MOUSE_RIGHT = 2;

const ZOOM_MIN = 0.05;
const ZOOM_MAX = 20;
const ZOOM_STEP = 1.2;

const DOUBLE_CLICK_ZOOM_FILL = 0.4;
const DOUBLE_CLICK_ZOOM_MAX = 4;

const calculateAreaFromPoints = (points: { x: number; y: number }[]): number => {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2 / 1000000;
};

function docSize(doc: any): number {
  if (!doc) return 0;
  return (
    (Array.isArray(doc.elements) ? doc.elements.length : 0) +
    (Array.isArray(doc.walls) ? doc.walls.length : 0) +
    (Array.isArray(doc.doors) ? doc.doors.length : 0) +
    (Array.isArray(doc.windows) ? doc.windows.length : 0) +
    (Array.isArray(doc.rooms) ? doc.rooms.length : 0)
  );
}

function getGroupKey(el: any): string | null {
  const g = el?.groupId ?? el?.GroupId ?? null;
  if (g === null || g === undefined || g === '') return null;
  return String(g);
}

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({ plan, activeTool = 'select', isReadOnly = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isLoading, error, activeDocumentState } = useFloorPlanFetching();
  const { offset, setOffset, isPanning, handleMouseDown, handleMouseMove, handleMouseUpOrLeave } = useCanvasPan();
  const { scale, setScale, handleWheel } = useCanvasZoom();
  const selection = useAppSelector((state: any) => state.floorPlan?.selection);
  const multiSelection = useAppSelector((state: any) => state.floorPlan?.multiSelection) as string[];
  const floorPlanState = useAppSelector((state: any) => state.floorPlan || {});
  const dispatch = useAppDispatch();
  const panMode = usePanMode();

  const calibrationState = useAppSelector((state: any) => state.floorPlan?.calibration);
  const hoveredIdFromRedux = useAppSelector((state: any) => state.floorPlan?.hoveredId);

  const transformRef = useRef<any>(null);

  const zoomSurface = useMemo<ZoomableSurface>(() => ({
    moduleName: 'Floor Plan Designer',
    getZoom: () => scale,
    setZoom: (z: number) => {
      const clamped = Math.min(Math.max(z, ZOOM_MIN), ZOOM_MAX);
      setScale(clamped);
    },
    zoomIn: () => { setScale((prev: number) => Math.min(prev * ZOOM_STEP, ZOOM_MAX)); },
    zoomOut: () => { setScale((prev: number) => Math.max(prev / ZOOM_STEP, ZOOM_MIN)); },
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

      const newOffsetX = -(worldCx - tf.centerX) * newFinalScale;
      const newOffsetY = -(worldCy - tf.centerY) * newYScale;

      setScale(targetZoom);
      setOffset({ x: newOffsetX, y: newOffsetY });
    },
  }), [scale, setScale, setOffset]);

  useZoomSurface(zoomSurface);

  const reduxDocument = useAppSelector((state: any) => state.floorPlan?.document);
  const reduxLayers = useAppSelector((state: any) => state.floorPlan?.layers);

  const layers = useMemo<Record<string, boolean>>(() => {
    const merged: Record<string, boolean> = { ...DEFAULT_LAYERS };
    if (reduxLayers && typeof reduxLayers === 'object') {
      for (const [k, v] of Object.entries(reduxLayers)) {
        if (v !== undefined && v !== null) merged[k] = Boolean(v);
      }
    }
    return merged;
  }, [reduxLayers]);

  const snapEnabled = true;

  useEffect(() => {
    const reduxSize = docSize(reduxDocument);
    const activeSize = docSize(activeDocumentState);
    const agree = reduxSize === activeSize && reduxDocument?.id === activeDocumentState?.id;
    console.log('[FloorPlanCanvas] source check', {
      reduxDocId: reduxDocument?.id ?? null,
      reduxSize,
      activeDocId: activeDocumentState?.id ?? null,
      activeSize,
      agree,
    });
  }, [reduxDocument, activeDocumentState]);

  const lastFrameDocRef = useRef<string | null>(null);

  useEffect(() => {
    const doc = floorPlanState.document;
    if (!doc) return;

    const elements = Array.isArray(doc.elements) ? doc.elements : [];
    const rooms = Array.isArray(doc.rooms) ? doc.rooms : [];
    if (rooms.length === 0) return;

    const roomsById = new Map<string, any>();
    for (const r of rooms) {
      const rid = String(r.id ?? r.Id ?? '');
      if (rid) roomsById.set(rid, r);
    }

    let patched = false;

    const healedElements = elements.map((e: any) => {
      const eid = String(e.id ?? e.Id ?? '');
      const isRoom = e.isRoom === true || String(e.type ?? '').toLowerCase() === 'room';
      if (!isRoom || !eid) return e;

      const room = roomsById.get(eid);
      if (!room) return e;

      const needsName = !e.name && room.name;
      const needsLux = e.targetLux == null && room.targetLux != null;
      const needsGroup = e.primaryGroup == null && room.primaryGroup != null;
      const needsIsRoom = !e.isRoom;

      if (!needsName && !needsLux && !needsGroup && !needsIsRoom) return e;

      patched = true;
      return {
        ...e,
        type: 'room',
        isRoom: true,
        name: e.name ?? room.name,
        targetLux: e.targetLux ?? room.targetLux ?? 500,
        primaryGroup: e.primaryGroup ?? room.primaryGroup ?? 1,
        fillStyle: e.fillStyle || 'rgba(74, 222, 128, 0.15)',
        strokeStyle: e.strokeStyle || '#4ADE80',
        layer: e.layer || 'rooms',
      };
    });

    const elementIds = new Set(elements.map((e: any) => String(e.id ?? e.Id ?? '')));
    const fullyMissing = rooms.filter((r: any) => {
      const rid = String(r.id ?? r.Id ?? '');
      return rid && !elementIds.has(rid);
    });

    if (fullyMissing.length > 0) {
      patched = true;
      for (const r of fullyMissing) {
        healedElements.push({
          ...r,
          type: 'room',
          isRoom: true,
          fillStyle: r.fillStyle || 'rgba(74, 222, 128, 0.15)',
          strokeStyle: r.strokeStyle || '#4ADE80',
          layer: 'rooms',
        });
      }
    }

    if (!patched) return;

    dispatch(setDocument({ ...doc, elements: healedElements }));
  }, [floorPlanState.document, dispatch]);

  useEffect(() => {
    const hiddenMap: Record<string, boolean> = {};
    if (layers.doors === false) { hiddenMap['doors'] = true; hiddenMap['door'] = true; }
    if (layers.walls === false) { hiddenMap['walls'] = true; hiddenMap['wall'] = true; }
    if (layers.windows === false) { hiddenMap['windows'] = true; hiddenMap['window'] = true; }
    if (layers.rooms === false) { hiddenMap['rooms'] = true; hiddenMap['room'] = true; }
    if (layers.rawgeometry === false) { hiddenMap['rawgeometry'] = true; }
    if (layers.exitRoutes === false) {
      hiddenMap['exitRoutes'] = true;
      hiddenMap['exitroute'] = true;
      hiddenMap['exitRoute'] = true;
    }
    (window as any).__hiddenLayersMap = hiddenMap;
  }, [layers]);

  useEffect(() => {
    const win = window as any;
    win.__floorPlanDispatch = dispatch;
    win.__floorPlanReduxState = floorPlanState;
    win.__floorPlanGetState = () => floorPlanState;

    return () => {
      win.__floorPlanDispatch = undefined;
      win.__floorPlanReduxState = undefined;
      win.__floorPlanGetState = undefined;
    };
  }, [dispatch, floorPlanState]);

  const commandManagerRef = useRef<CommandManager | null>((window as any).__floorPlanCommandManagerInstance || null);
  if (!commandManagerRef.current) {
    commandManagerRef.current = new CommandManager();
    (window as any).__floorPlanCommandManagerInstance = commandManagerRef.current;
  }

  useEffect(() => {
    if (activeDocumentState) { dispatch(setLayerVisibility({ snap: false })); }
  }, [activeDocumentState, dispatch]);

  const [snapResult, setSnapResult] = useState<SnapResult | null>(null);
  const [, forceUpdate] = useState(0);
  const [dragTick, setDragTick] = useState(0);
  const wallToolRef = useRef<WallTool | null>(null);
  const roomToolRef = useRef<RoomTool | null>(null);
  const doorToolRef = useRef<DoorTool | null>(null);
  const windowToolRef = useRef<WindowTool | null>(null);
  const measurementRulerToolRef = useRef<MeasurementRulerTool | null>(null);
  const calibrationRulerToolRef = useRef<CalibrationRulerTool | null>(null);
  const [currentTool, setCurrentTool] = useState(activeTool);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoverRafRef = useRef<number | null>(null);
  const pendingHoverPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    dispatch(setHoveredIdAction(hoveredId));
  }, [hoveredId, dispatch]);

  const dragStartWorldRef = useRef<{ x: number; y: number } | null>(null);
  const dragCurrentWorldRef = useRef<{ x: number; y: number } | null>(null);
  const isDragRectRef = useRef(false);
  const dragStartScreenRef = useRef<{ x: number; y: number } | null>(null);

  const isMiddlePanningRef = useRef(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const isSpacePanningRef = useRef(false);
  const isPanModePanningRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
      e.preventDefault();
      setIsSpaceDown(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      setIsSpaceDown(false);
      if (isSpacePanningRef.current) {
        isSpacePanningRef.current = false;
        handleMouseUpOrLeave();
      }
    };
    const onBlur = () => {
      setIsSpaceDown(false);
      if (isSpacePanningRef.current) {
        isSpacePanningRef.current = false;
        handleMouseUpOrLeave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prevent = (e: MouseEvent) => {
      if (e.button === MOUSE_MIDDLE) e.preventDefault();
    };
    canvas.addEventListener('mousedown', prevent);
    return () => canvas.removeEventListener('mousedown', prevent);
  }, []);

  useEffect(() => {
    const handleSelectionChanged = (event: CustomEvent) => {
      const detail = event.detail;
      if (detail?.type === 'room') {
        window.dispatchEvent(new CustomEvent('sbs:canvas-update'));
      }
    };

    window.addEventListener('sbs:selection-changed', handleSelectionChanged as EventListener);
    return () => {
      window.removeEventListener('sbs:selection-changed', handleSelectionChanged as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleKeyDownDelete = (e: KeyboardEvent) => {
      if (isReadOnly) return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;

      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.isContentEditable)
      ) {
        return;
      }

      const win = window as any;
      const state = win.__floorPlanGetState?.() || {};
      const currentSelection = state?.selection;
      const currentMultiSelection: string[] = Array.isArray(state?.multiSelection)
        ? state.multiSelection
        : [];

      const rawDoc = state.document;
      if (!rawDoc) return;
      const allElements: any[] = Array.isArray(rawDoc.elements) ? rawDoc.elements : [];

      const fpsFixtureIds = new Set<string>(
        (Array.isArray(rawDoc.electricalFixtures) ? rawDoc.electricalFixtures : [])
          .map((f: any) => String(f?.id ?? f?.Id ?? ''))
          .filter((id: string) => id.length > 0)
      );

      const targetIds = new Set<string>();
      const singleId = currentSelection
        ? String(currentSelection.id || currentSelection.Id || '')
        : '';
      if (singleId && !fpsFixtureIds.has(singleId)) targetIds.add(singleId);
      for (const id of currentMultiSelection) {
        if (!id) continue;
        const sid = String(id);
        if (fpsFixtureIds.has(sid)) continue;
        targetIds.add(sid);
      }

      const groupKeysToDelete = new Set<string>();
      for (const el of allElements) {
        const id = String(el?.id ?? el?.Id ?? '');
        const gk = getGroupKey(el);
        if (gk && targetIds.has(gk)) groupKeysToDelete.add(gk);
        if (!id || !targetIds.has(id)) continue;
        if (gk) groupKeysToDelete.add(gk);
      }
      if (groupKeysToDelete.size > 0) {
        for (const el of allElements) {
          const gk = getGroupKey(el);
          if (!gk || !groupKeysToDelete.has(gk)) continue;
          const id = String(el?.id ?? el?.Id ?? '');
          if (id && !fpsFixtureIds.has(id)) targetIds.add(id);
        }
      }

      if (targetIds.size === 0) return;

      e.preventDefault();

      try {
        const arraysToScrub = [
          'elements', 'entities', 'walls', 'doors', 'windows', 'rooms',
          'items', 'objects', 'drawings', 'components', 'importedDrawings',
        ];

        const updatedDocument: any = { ...rawDoc };
        let removedAny = false;

        for (const key of arraysToScrub) {
          const arr = rawDoc[key];
          if (!Array.isArray(arr)) continue;

          const next = arr.filter((el: any) => {
            const id = String(el?.id ?? el?.Id ?? '');
            if (!id) return true;
            if (fpsFixtureIds.has(id)) return true;
            return !targetIds.has(id);
          });

          if (next.length !== arr.length) {
            updatedDocument[key] = next;
            removedAny = true;
          }
        }

        if (groupKeysToDelete.size > 0) {
          const semanticKeys = ['doors', 'windows', 'walls'] as const;
          for (const key of semanticKeys) {
            const arr = rawDoc[key];
            if (!Array.isArray(arr)) continue;
            const next = arr.filter((d: any) => {
              const id = String(d?.id ?? d?.Id ?? '');
              return !id || !groupKeysToDelete.has(id);
            });
            if (next.length !== arr.length) {
              updatedDocument[key] = next;
              removedAny = true;
            }
          }
        }

        if (!removedAny) return;

        const dispatchFn = win.__floorPlanDispatch;
        if (typeof dispatchFn === 'function') {
          dispatchFn({ type: 'floorPlan/setSelection', payload: null });
          dispatchFn({ type: 'floorPlan/clearMultiSelection' });
          dispatchFn({ type: 'floorPlan/markDirty' });
          dispatchFn({ type: 'floorPlan/setDocument', payload: updatedDocument });
        }

        window.dispatchEvent(new CustomEvent('sbs:canvas-update'));
      } catch (err) {
        console.error('[FloorPlanCanvas] Failed to delete elements:', err);
      }
    };

    window.addEventListener('keydown', handleKeyDownDelete);
    return () => window.removeEventListener('keydown', handleKeyDownDelete);
  }, [isReadOnly]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

      const tool = getActiveToolInstance();
      if (tool && typeof (tool as any).onKeyDown === 'function') {
        try {
          const consumed = (tool as any).onKeyDown(e);
          if (consumed === true) {
            e.preventDefault();
            return;
          }
        } catch { /* tool swallowed the error */ }
      }

      if (e.key !== 'Escape') return;
      const win = window as any;
      const state = win.__floorPlanGetState?.() || {};
      const ms: string[] = Array.isArray(state?.multiSelection) ? state.multiSelection : [];
      if (ms.length === 0) return;
      const dispatchFn = win.__floorPlanDispatch;
      if (typeof dispatchFn === 'function') {
        dispatchFn({ type: 'floorPlan/clearMultiSelection' });
        window.dispatchEvent(new CustomEvent('sbs:canvas-update'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTool]);

  useEffect(() => {
    [
      wallToolRef,
      roomToolRef,
      doorToolRef,
      windowToolRef,
      measurementRulerToolRef,
      calibrationRulerToolRef,
    ].forEach(ref => {
      if (ref.current) { ref.current.deactivate(); ref.current = null; }
    });
    setSnapResult(null); FloorPlanSnapHook.clear();
    if (currentTool === 'wall') { wallToolRef.current = new WallTool(); wallToolRef.current.activate(); }
    else if (currentTool === 'room') { roomToolRef.current = new RoomTool(); roomToolRef.current.activate(); }
    else if (currentTool === 'door') { doorToolRef.current = new DoorTool(); doorToolRef.current.activate(); }
    else if (currentTool === 'window') { windowToolRef.current = new WindowTool(); windowToolRef.current.activate(); }
    else if (currentTool === 'measure') {
      measurementRulerToolRef.current = new MeasurementRulerTool();
      measurementRulerToolRef.current.activate();
    }
    else if (currentTool === 'calibration') {
      calibrationRulerToolRef.current = new CalibrationRulerTool();
      calibrationRulerToolRef.current.activate();
    }
    forceUpdate(prev => prev + 1);
  }, [currentTool]);

  useEffect(() => setCurrentTool(activeTool), [activeTool]);

  useEffect(() => {
    const handler = (e: CustomEvent) => { const id = e.detail?.id; if (id) setCurrentTool(id); };
    window.addEventListener('sbs:tool-change', handler as EventListener);
    return () => window.removeEventListener('sbs:tool-change', handler as EventListener);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const handler = (e: WheelEvent) => { handleWheel(e as unknown as React.WheelEvent<HTMLCanvasElement>); };
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, [handleWheel]);

  const pendingRedrawRef = useRef<number | null>(null);

  useEffect(() => {
    const scheduleRedraw = () => {
      if (pendingRedrawRef.current != null) return;
      pendingRedrawRef.current = requestAnimationFrame(() => {
        pendingRedrawRef.current = null;
        forceUpdate(prev => prev + 1);
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
    if (currentTool !== 'select') {
      setHoveredId(null);
    }
  }, [currentTool]);

  useEffect(() => {
    return () => {
      if (hoverRafRef.current != null) {
        cancelAnimationFrame(hoverRafRef.current);
        hoverRafRef.current = null;
      }
    };
  }, []);

  const dataSource = activeDocumentState || plan;
  const renderPlan: ArchitecturalPlan = usePlanRenderer(dataSource, layers);

  const getViewport = () => {
    const tf = transformRef.current; if (!tf) return null;
    return {
      worldToScreen: (wp: { x: number; y: number }) => {
        const { finalScale, yScale, centerX, centerY, width, height, offsetX, offsetY } = tf;
        return {
          x: width / 2 + offsetX + (wp.x - centerX) * finalScale,
          y: height / 2 + offsetY + (wp.y - centerY) * yScale,
        };
      },
      screenToWorld: (sp: { x: number; y: number }) => {
        const { finalScale, yScale, centerX, centerY, width, height, offsetX, offsetY } = tf;
        return {
          x: (sp.x - width / 2 - offsetX) / finalScale + centerX,
          y: (sp.y - height / 2 - offsetY) / yScale + centerY,
        };
      },
    };
  };

  const getActiveToolInstance = () => {
    if (currentTool === 'wall') return wallToolRef.current;
    if (currentTool === 'room') return roomToolRef.current;
    if (currentTool === 'door') return doorToolRef.current;
    if (currentTool === 'window') return windowToolRef.current;
    if (currentTool === 'measure') return measurementRulerToolRef.current;
    if (currentTool === 'calibration') return calibrationRulerToolRef.current;
    return null;
  };

  const isGeometryTool =
    currentTool === 'wall' ||
    currentTool === 'room' ||
    currentTool === 'door' ||
    currentTool === 'window';
  const isOverlayTool =
    currentTool === 'measure' || currentTool === 'calibration';
  const isDrawingTool = isGeometryTool || isOverlayTool;

  const cursorStyle: string = useMemo(() => {
    if (isMiddlePanningRef.current || isSpacePanningRef.current || isPanModePanningRef.current) return 'grabbing';
    if (panMode || isSpaceDown) return 'grab';
    if (isPanning) return 'grabbing';

    if (isReadOnly) return 'default';

    if (isDrawingTool) return 'crosshair';
    if (currentTool === 'select' && hoveredId) return 'pointer';
    return currentTool === 'select' ? 'crosshair' : 'grab';
  }, [currentTool, isPanning, hoveredId, isSpaceDown, panMode, isReadOnly, isDrawingTool]);

  useEffect(() => {
    let cancelled = false;

    const frame = requestAnimationFrame(() => {
      if (cancelled) return;

      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = 1024; const cssHeight = 650;
      canvas.width = cssWidth * dpr; canvas.height = cssHeight * dpr;
      canvas.style.width = `${cssWidth}px`; canvas.style.height = `${cssHeight}px`;

      const frameDocId = (renderPlan as any)?.id ?? null;
      const frameElements = Array.isArray((renderPlan as any)?.elements)
        ? (renderPlan as any).elements.length
        : 0;
      if (lastFrameDocRef.current !== frameDocId) {
        console.log('[FloorPlanCanvas] render frame', {
          frameDocId,
          frameElements,
          dataSourceId: dataSource?.id ?? null,
          dataSourceElements: Array.isArray(dataSource?.elements)
            ? dataSource.elements.length
            : 0,
        });
        lastFrameDocRef.current = frameDocId;
      }

      const currentSelection = selection || (window as any).__currentSelection || null;
      const selectedId =
        (currentSelection?.id ?? currentSelection?.Id ?? null) as string | null;

      const multiSelectionSet = new Set(multiSelection || []);

      CanvasRenderer.flipY = true;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      let hasPoints = false;

      renderPlan.elements.forEach(el => {
        const pts = el.points || el.vertices || (el.start && el.end ? [el.start, el.end] : []);
        pts.forEach((pt: any) => {
          if (pt && typeof pt.x === 'number' && typeof pt.y === 'number') {
            if (pt.x < minX) minX = pt.x; if (pt.x > maxX) maxX = pt.x;
            if (pt.y < minY) minY = pt.y; if (pt.y > maxY) maxY = pt.y;
            hasPoints = true;
          }
        });
      });

      if (Array.isArray(renderPlan.doors)) {
        renderPlan.doors.forEach(d => {
          const lock = getClosedLockPoint(d);
          [{ x: d.hingeX, y: d.hingeY }, lock].forEach(pt => {
            if (pt.x < minX) minX = pt.x; if (pt.x > maxX) maxX = pt.x;
            if (pt.y < minY) minY = pt.y; if (pt.y > maxY) maxY = pt.y;
            hasPoints = true;
          });
        });
      }

      if (!hasPoints) { minX = -1000; maxX = 1000; minY = -1000; maxY = 1000; }
      const dxfWidth = maxX - minX || 1; const dxfHeight = maxY - minY || 1;
      const finalTotalScale = Math.min((canvas.width - 120) / dxfWidth, (canvas.height - 120) / dxfHeight) * (scale || 1);
      const yScale = CanvasRenderer.flipY ? -finalTotalScale : finalTotalScale;

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      transformRef.current = {
        finalScale: finalTotalScale,
        yScale,
        centerX, centerY,
        width: canvas.width,
        height: canvas.height,
        offsetX: offset.x,
        offsetY: offset.y
      };

      CanvasRenderer.clearAndDraw(
        ctx,
        canvas.width,
        canvas.height,
        renderPlan,
        scale,
        offset,
        {
          showDimensions: false,
          layers,
          selectedId,
          hoveredId,
        }
      );

      const areRoomsVisible = layers.rooms !== false;

      if (areRoomsVisible) {
        ctx.save();
        ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
        ctx.scale(finalTotalScale, yScale);
        ctx.translate(-centerX, -centerY);

        renderPlan.elements.forEach((element) => {
          if (!element) return;
          const type = String(element.type || '').toLowerCase();

          if (type === 'room' || type === 'rooms' || element.isRoom) {
            const pts = element.points || element.vertices || [];
            if (!Array.isArray(pts) || pts.length < 3) return;

            const elId = String(element.id ?? element.Id ?? '');
            const isSelected =
              (currentSelection && (currentSelection.id === element.id || currentSelection.Id === element.id)) ||
              (elId && multiSelectionSet.has(elId));

            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
              ctx.lineTo(pts[i].x, pts[i].y);
            }
            ctx.closePath();

            ctx.fillStyle = isSelected ? 'rgba(5, 255, 196, 0.25)' : (element.fillStyle || 'rgba(74, 222, 128, 0.12)');
            ctx.fill();

            ctx.strokeStyle = isSelected ? '#05FFC4' : (element.strokeStyle || '#4ADE80');
            ctx.lineWidth = (isSelected ? 3 : 1.5) / finalTotalScale;
            ctx.setLineDash([]);
            ctx.stroke();
          }
        });

        ctx.restore();

        renderPlan.elements.forEach((element) => {
          if (!element) return;
          const type = String(element.type || '').toLowerCase();

          if (type === 'room' || type === 'rooms' || element.isRoom) {
            const pts = element.points || element.vertices || [];
            if (!Array.isArray(pts) || pts.length < 3) return;

            const elId = String(element.id ?? element.Id ?? '');
            const isSelected =
              (currentSelection && (currentSelection.id === element.id || currentSelection.Id === element.id)) ||
              (elId && multiSelectionSet.has(elId));

            let cx = 0, cy = 0;
            for (const p of pts) { cx += p.x; cy += p.y; }
            cx /= pts.length;
            cy /= pts.length;

            const screenCx = canvas.width / 2 + offset.x + (cx - centerX) * finalTotalScale;
            const screenCy = canvas.height / 2 + offset.y + (cy - centerY) * yScale;

            const roomSize = Math.sqrt(Math.abs(dxfWidth * dxfHeight));
            const fontSize = Math.max(10, Math.min(22, roomSize / 35));
            const lineHeight = fontSize * 1.2;

            const areaValue = calculateAreaFromPoints(pts);

            const roomName = element.name || 'Unnamed Room';
            ctx.fillStyle = isSelected ? '#05FFC4' : 'rgba(74, 222, 128, 0.95)';
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(roomName, screenCx, screenCy - lineHeight * 0.6);

            const luxValue = element.targetLux || element.lux || 500;
            const groupValue = element.primaryGroup || element.group || 1;
            ctx.fillStyle = isSelected ? 'rgba(5, 255, 196, 0.8)' : 'rgba(255, 255, 255, 0.6)';
            ctx.font = `${fontSize * 0.55}px sans-serif`;
            ctx.fillText(`${luxValue} lx  |  G${groupValue}`, screenCx, screenCy + lineHeight * 0.5);

            ctx.fillStyle = isSelected ? 'rgba(5, 255, 196, 0.6)' : 'rgba(255, 255, 255, 0.4)';
            ctx.font = `${fontSize * 0.45}px sans-serif`;
            ctx.fillText(`${areaValue.toFixed(2)} m²`, screenCx, screenCy + lineHeight * 1.3);
          }
        });
      }

      if (multiSelectionSet.size > 0) {
        ctx.save();
        ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
        ctx.scale(finalTotalScale, yScale);
        ctx.translate(-centerX, -centerY);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3 / finalTotalScale;
        ctx.setLineDash([]);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const element of renderPlan.elements) {
          if (!element) continue;
          const elId = String(element.id ?? element.Id ?? '');
          if (!elId || !multiSelectionSet.has(elId)) continue;

          const type = String(element.type || '').toLowerCase();
          if (type === 'room' || type === 'rooms' || element.isRoom) continue;

          const pts = element.points || element.vertices || (element.start && element.end ? [element.start, element.end] : []);
          if (!Array.isArray(pts) || pts.length < 2) continue;

          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      if (
        isDragRectRef.current &&
        dragStartWorldRef.current &&
        dragCurrentWorldRef.current
      ) {
        const s = dragStartWorldRef.current;
        const c = dragCurrentWorldRef.current;
        const isCrossing = c.x < s.x;

        const screenS = {
          x: canvas.width / 2 + offset.x + (s.x - centerX) * finalTotalScale,
          y: canvas.height / 2 + offset.y + (s.y - centerY) * yScale,
        };
        const screenC = {
          x: canvas.width / 2 + offset.x + (c.x - centerX) * finalTotalScale,
          y: canvas.height / 2 + offset.y + (c.y - centerY) * yScale,
        };

        const rectX = Math.min(screenS.x, screenC.x);
        const rectY = Math.min(screenS.y, screenC.y);
        const rectW = Math.abs(screenC.x - screenS.x);
        const rectH = Math.abs(screenC.y - screenS.y);

        ctx.save();
        if (isCrossing) {
          ctx.fillStyle = 'rgba(74, 222, 128, 0.12)';
          ctx.strokeStyle = '#4ADE80';
          ctx.setLineDash([6, 4]);
          ctx.lineWidth = 1.5;
        } else {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
          ctx.strokeStyle = '#38BDF8';
          ctx.setLineDash([]);
          ctx.lineWidth = 1.5;
        }
        ctx.fillRect(rectX, rectY, rectW, rectH);
        ctx.strokeRect(rectX, rectY, rectW, rectH);
        ctx.restore();
      }

      const activeToolInstance = getActiveToolInstance();
      if (activeToolInstance && transformRef.current) {
        const toolLayerKey = TOOL_TO_LAYER_KEY[currentTool] ?? null;
        const shouldRenderOverlay = toolLayerKey === null || layers[toolLayerKey] !== false;

        if (shouldRenderOverlay) {
          const viewport = getViewport();
          if (viewport) {
            (activeToolInstance as any).viewport = viewport;
            (activeToolInstance as any).context = { viewport };
          }
          (activeToolInstance as any).__document = renderPlan;
          if (typeof activeToolInstance.renderOverlay === 'function') {
            activeToolInstance.renderOverlay(ctx);
          }
        }
      }

      if (snapResult && snapResult.type !== null) {
        const viewport = getViewport();
        if (viewport) {
          SnapService.renderSnapIndicator(ctx, snapResult.point, snapResult.type, viewport);
        }
      }

      {
        const lm = LayerManager.getInstance();

        lm.applyVisibility(
          {
            calibration: layers.calibration !== false,
            preview: layers.preview !== false,
          },
          {
            calibration: 'calibration',
            preview: 'preview',
          }
        );

        const calLayer: any = lm.findLayer('calibration');
        if (calLayer && typeof calLayer.update === 'function') {
          calLayer.update({
            ...(calibrationState || { p1: null, p2: null, knownDistance: null, unit: 'mm', pxPerUnit: null }),
            cursor: null,
          });
        }

        const prevLayer: any = lm.findLayer('preview');
        if (prevLayer && typeof prevLayer.update === 'function') {
          prevLayer.update({
            hoveredId: hoveredIdFromRedux ?? hoveredId ?? null,
            selectionId: selectedId,
            multiSelection: multiSelection || [],
          });
        }

        const viewportLike = {
          zoom: scale,
          offsetX: offset.x,
          offsetY: offset.y,
          worldToScreen: (p: { x: number; y: number }) => ({
            x: canvas.width / 2 + offset.x + (p.x - centerX) * finalTotalScale,
            y: canvas.height / 2 + offset.y + (p.y - centerY) * yScale,
          }),
          screenToWorld: (p: { x: number; y: number }) => ({
            x: (p.x - canvas.width / 2 - offset.x) / finalTotalScale + centerX,
            y: (p.y - canvas.height / 2 - offset.y) / yScale + centerY,
          }),
        };

        const docLike: any = {
          getElements: () => (renderPlan as any).elements || [],
          getWalls: () => (renderPlan as any).walls || [],
          getRooms: () => (renderPlan as any).rooms || [],
          getDoors: () => (renderPlan as any).doors || [],
          getWindows: () => (renderPlan as any).windows || [],
          getImportedDrawings: () => (renderPlan as any).importedDrawings || [],
        };

        const rc = new RenderContext(docLike, viewportLike);

        ctx.save();
        ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
        ctx.scale(finalTotalScale, yScale);
        ctx.translate(-centerX, -centerY);

        for (const layer of lm.getRenderLayers()) {
          const id = layer.getId();
          if (id !== 'calibration' && id !== 'preview') continue;
          try {
            layer.render(ctx, rc);
          } catch (e) {
            console.warn(`[FloorPlanCanvas] layer '${id}' render failed`, e);
          }
        }

        ctx.restore();
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [
    renderPlan, scale, offset, selection, multiSelection, currentTool, layers,
    snapResult, hoveredId, dragTick,
    calibrationState, hoveredIdFromRedux,
  ]);

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !transformRef.current) return;
    const dpr = window.devicePixelRatio || 1;
    const screenX = (e.clientX - rect.left) * dpr;
    const screenY = (e.clientY - rect.top) * dpr;
    const tf = transformRef.current;
    const rawWorldX = (screenX - tf.width / 2 - tf.offsetX) / tf.finalScale + tf.centerX;
    const rawWorldY = (screenY - tf.height / 2 - tf.offsetY) / tf.yScale + tf.centerY;

    if (e.button === MOUSE_RIGHT) {
      return;
    }

    if (e.button === MOUSE_MIDDLE) {
      e.preventDefault();
      isMiddlePanningRef.current = true;
      handleMouseDown(e);
      return;
    }

    if (e.button === MOUSE_LEFT && isSpaceDown) {
      e.preventDefault();
      isSpacePanningRef.current = true;
      handleMouseDown(e);
      return;
    }

    if (e.button === MOUSE_LEFT && panMode) {
      e.preventDefault();
      isPanModePanningRef.current = true;
      handleMouseDown(e);
      return;
    }

    if (isReadOnly) {
      return;
    }

    if (e.button !== MOUSE_LEFT) return;

    if (currentTool === 'select' && !isPanning) {
      dragStartWorldRef.current = { x: rawWorldX, y: rawWorldY };
      dragCurrentWorldRef.current = { x: rawWorldX, y: rawWorldY };
      dragStartScreenRef.current = { x: screenX, y: screenY };
      isDragRectRef.current = true;
      setDragTick(t => t + 1);
      return;
    }

    if (isPanning || !isDrawingTool) {
      return;
    }

    let finalWorld = { x: rawWorldX, y: rawWorldY };
    let snap: SnapResult | null = null;

    if (snapEnabled) {
      const viewport = getViewport();
      if (viewport) {
        snap = SnapService.getSnappedPoint(screenX, screenY, rawWorldX, rawWorldY, viewport);
        if (snap && snap.type !== null) {
          finalWorld = snap.point;
          setSnapResult(snap);
          FloorPlanSnapHook.updateSnapTarget(finalWorld, viewport);
        } else {
          setSnapResult(null);
          FloorPlanSnapHook.clear();
        }
      }
    }

    const activeToolInstance = getActiveToolInstance();
    if (activeToolInstance) {
      (activeToolInstance as any).__snapType = snap?.type ?? null;

      if (typeof (activeToolInstance as any).onPointerDown === 'function') {
        (activeToolInstance as any).onPointerDown({
          screenX,
          screenY,
          worldX: finalWorld.x,
          worldY: finalWorld.y,
          button: e.button,
          originalEvent: e,
        });
      }
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMiddlePanningRef.current || isSpacePanningRef.current || isPanModePanningRef.current) {
      handleMouseMove(e);
      return;
    }

    handleMouseMove(e);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !transformRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    const screenX = (e.clientX - rect.left) * dpr;
    const screenY = (e.clientY - rect.top) * dpr;
    const tf = transformRef.current;
    const rawWorldX = (screenX - tf.width / 2 - tf.offsetX) / tf.finalScale + tf.centerX;
    const rawWorldY = (screenY - tf.height / 2 - tf.offsetY) / tf.yScale + tf.centerY;

    if (isReadOnly) {
      if (hoveredId !== null) setHoveredId(null);
      return;
    }

    if (isDragRectRef.current && dragStartWorldRef.current && dragStartScreenRef.current) {
      const dxScreen = screenX - dragStartScreenRef.current.x;
      const dyScreen = screenY - dragStartScreenRef.current.y;
      const movedEnough = Math.hypot(dxScreen, dyScreen) >= DRAG_DEAD_ZONE_PX;

      if (movedEnough) {
        dragCurrentWorldRef.current = { x: rawWorldX, y: rawWorldY };
        setDragTick(t => t + 1);
      }
      return;
    }

    if (currentTool === 'select' && !isPanning) {
      pendingHoverPointRef.current = { x: rawWorldX, y: rawWorldY };
      if (hoverRafRef.current == null) {
        hoverRafRef.current = requestAnimationFrame(() => {
          hoverRafRef.current = null;
          const pt = pendingHoverPointRef.current;
          if (!pt) return;
          const tfNow = transformRef.current;
          if (!tfNow) return;
          const toleranceWorld = HIT_TEST_TOLERANCE_PX / tfNow.finalScale;
          const hit = hitTestElements(pt.x, pt.y, renderPlan, toleranceWorld, layers);
          const hitId = hit.element ? String(hit.element.id || hit.element.Id || '') : null;
          setHoveredId(prev => (prev === hitId ? prev : hitId));
        });
      }
      return;
    }

    if (hoveredId !== null) setHoveredId(null);

    if (isPanning || !isDrawingTool) return;

    let finalWorld = { x: rawWorldX, y: rawWorldY };
    let snap: SnapResult | null = null;

    if (snapEnabled) {
      const viewport = getViewport();
      if (viewport) {
        snap = SnapService.getSnappedPoint(screenX, screenY, rawWorldX, rawWorldY, viewport);
        if (snap && snap.type !== null) {
          finalWorld = snap.point;
          setSnapResult(snap);
          FloorPlanSnapHook.updateSnapTarget(finalWorld, viewport);
        } else {
          setSnapResult(null);
          FloorPlanSnapHook.clear();
        }
      }
    }

    const activeToolInstance = getActiveToolInstance();
    if (activeToolInstance) {
      (activeToolInstance as any).__snapType = snap?.type ?? null;

      if (typeof (activeToolInstance as any).onPointerMove === 'function') {
        (activeToolInstance as any).onPointerMove({
          screenX,
          screenY,
          worldX: finalWorld.x,
          worldY: finalWorld.y,
          originalEvent: e,
        });
      }
    }
  };

  const handlePointerUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isMiddlePanningRef.current = false;
    isSpacePanningRef.current = false;
    isPanModePanningRef.current = false;

    if (isDragRectRef.current && dragStartWorldRef.current && dragStartScreenRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const screenX = rect ? (e.clientX - rect.left) * dpr : 0;
      const screenY = rect ? (e.clientY - rect.top) * dpr : 0;
      const startScreen = dragStartScreenRef.current;

      const dragScreenDist = Math.hypot(
        screenX - startScreen.x,
        screenY - startScreen.y
      );

      const startWorld = dragStartWorldRef.current;
      isDragRectRef.current = false;
      dragStartWorldRef.current = null;
      dragCurrentWorldRef.current = null;
      dragStartScreenRef.current = null;

      if (dragScreenDist < DRAG_DEAD_ZONE_PX) {
        const tf = transformRef.current;
        if (tf) {
          const clickWorldX = startWorld.x;
          const clickWorldY = startWorld.y;
          const toleranceWorld = HIT_TEST_TOLERANCE_PX / tf.finalScale;
          const hit = hitTestElements(clickWorldX, clickWorldY, renderPlan, toleranceWorld, layers);

          if (hit.element) {
            const el = hit.element;
            const group = Array.isArray(hit.group) && hit.group.length > 0
              ? hit.group
              : [el];

            const groupIds = group
              .map((g: any) => String(g.id ?? g.Id ?? ''))
              .filter((id: string) => id.length > 0);

            const groupKey = getGroupKey(el);
            const primaryId = groupKey ?? String(el.id ?? el.Id ?? '');

            const targetPayload = {
              ...el,
              id: primaryId,
              elementId: el.id || el.Id,
              groupId: groupKey ?? undefined,
              groupIds,
              properties: {
                ...el,
                id: primaryId,
                elementId: el.id || el.Id,
                groupIds,
              },
            };
            dispatch({ type: 'floorPlan/setSelection', payload: targetPayload });
            dispatch(setMultiSelection(groupIds));
          } else {
            dispatch({ type: 'floorPlan/setSelection', payload: null });
            if (multiSelection.length > 0) dispatch(clearMultiSelection());
          }
        }
        setDragTick(t => t + 1);
        window.dispatchEvent(new CustomEvent('sbs:canvas-update'));
        handleMouseUpOrLeave(e);
        return;
      }

      const tf = transformRef.current;
      let cWorld: { x: number; y: number };
      if (tf && rect) {
        cWorld = {
          x: (screenX - tf.width / 2 - tf.offsetX) / tf.finalScale + tf.centerX,
          y: (screenY - tf.height / 2 - tf.offsetY) / tf.yScale + tf.centerY,
        };
      } else {
        cWorld = startWorld;
      }

      const s = startWorld;
      const isCrossing = cWorld.x < s.x;

      const selectionRect: Rect = {
        minX: Math.min(s.x, cWorld.x),
        maxX: Math.max(s.x, cWorld.x),
        minY: Math.min(s.y, cWorld.y),
        maxY: Math.max(s.y, cWorld.y),
      };

      const ids = isCrossing
        ? hitTestRectCrossing(selectionRect, renderPlan, layers)
        : hitTestRectWindow(selectionRect, renderPlan, layers);

      dispatch(setMultiSelection(ids));
      dispatch({ type: 'floorPlan/setSelection', payload: null });

      setDragTick(t => t + 1);
      window.dispatchEvent(new CustomEvent('sbs:canvas-update'));
      handleMouseUpOrLeave(e);
      return;
    }

    handleMouseUpOrLeave(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredId !== null) setHoveredId(null);
    isMiddlePanningRef.current = false;
    isSpacePanningRef.current = false;
    isPanModePanningRef.current = false;
    if (isDragRectRef.current) {
      isDragRectRef.current = false;
      dragStartWorldRef.current = null;
      dragCurrentWorldRef.current = null;
      dragStartScreenRef.current = null;
      setDragTick(t => t + 1);
    }
    handleMouseUpOrLeave(e);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isReadOnly && (currentTool === 'wall' || currentTool === 'room' || currentTool === 'door' || currentTool === 'window')) {
      return;
    }

    if (currentTool === 'wall' || currentTool === 'room' || currentTool === 'door' || currentTool === 'window') {
      const activeToolInstance = getActiveToolInstance();
      if (!activeToolInstance || typeof (activeToolInstance as any).onDoubleClick !== 'function') return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !transformRef.current) return;
      const dpr = window.devicePixelRatio || 1;
      const screenX = (e.clientX - rect.left) * dpr;
      const screenY = (e.clientY - rect.top) * dpr;
      const tf = transformRef.current;
      const worldX = (screenX - tf.width / 2 - tf.offsetX) / tf.finalScale + tf.centerX;
      const worldY = (screenY - tf.height / 2 - tf.offsetY) / tf.yScale + tf.centerY;
      (activeToolInstance as any).onDoubleClick({ screenX, screenY, worldX, worldY, originalEvent: e });
      return;
    }

    if (currentTool !== 'select') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    const tf = transformRef.current;
    if (!rect || !tf) return;
    const dpr = window.devicePixelRatio || 1;
    const screenX = (e.clientX - rect.left) * dpr;
    const screenY = (e.clientY - rect.top) * dpr;
    const worldX = (screenX - tf.width / 2 - tf.offsetX) / tf.finalScale + tf.centerX;
    const worldY = (screenY - tf.height / 2 - tf.offsetY) / tf.yScale + tf.centerY;

    const toleranceWorld = HIT_TEST_TOLERANCE_PX / tf.finalScale;
    const hit = hitTestElements(worldX, worldY, renderPlan, toleranceWorld, layers);
    if (!hit.element) return;

    const group = Array.isArray(hit.group) && hit.group.length > 0 ? hit.group : [hit.element];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of group) {
      const pts = (el as any).points || (el as any).vertices ||
        ((el as any).start && (el as any).end ? [(el as any).start, (el as any).end] : []);
      if (!Array.isArray(pts)) continue;
      for (const p of pts) {
        if (p && typeof p.x === 'number' && typeof p.y === 'number') {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }
      }
    }
    if (!Number.isFinite(minX)) {
      const fx = (hit.element as any).x;
      const fy = (hit.element as any).y;
      if (typeof fx === 'number' && typeof fy === 'number') {
        minX = fx - 5; maxX = fx + 5;
        minY = fy - 5; maxY = fy + 5;
      }
    }
    if (!Number.isFinite(minX)) return;

    const w = maxX - minX, h = maxY - minY;
    if (w < 20) { const cx = (minX + maxX) / 2; minX = cx - 10; maxX = cx + 10; }
    if (h < 20) { const cy = (minY + maxY) / 2; minY = cy - 10; maxY = cy + 10; }

    zoomSurface.zoomToRect(
      { minX, minY, maxX, maxY },
      { fill: DOUBLE_CLICK_ZOOM_FILL, maxZoom: DOUBLE_CLICK_ZOOM_MAX }
    );
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  if (isLoading && !plan) return <div style={{ color: '#05FFC4', fontFamily: 'monospace', padding: '16px' }}>📡 Loading schematics...</div>;
  if (error && !plan) return <div style={{ color: '#EF4444', fontFamily: 'monospace', padding: '16px' }}>❌ System Error: {error}</div>;

  return (
    <div style={{ position: 'relative', width: '1024px' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
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