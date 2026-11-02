// src/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/hooks/useCanvasPointerHandlers.ts

import { useCallback } from 'react';
import { useAppDispatch } from '@/Application/ConfigureStore';
import {
  setMultiSelection,
  clearMultiSelection,
} from '@/modules/FloorPlanDesigner/Store/FloorPlanSlice';
import {
  hitTestElements,
  hitTestRectWindow,
  hitTestRectCrossing,
  Rect,
} from '@/modules/FloorPlanDesigner/Utils/HitTest';
import { SnapService } from '@/modules/FloorPlanDesigner/Utils/SnapService';
import FloorPlanSnapHook from '@/modules/FloorPlanDesigner/Utils/FloorPlanSnapHook';
import type { ArchitecturalPlan } from '@/modules/FloorPlanDesigner/core/types';
import type {
  CanvasTransform,
  Viewport,
} from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/types';
import {
  DRAG_DEAD_ZONE_PX,
  HIT_TEST_TOLERANCE_PX,
  MOUSE_LEFT,
  MOUSE_MIDDLE,
  MOUSE_RIGHT,
  DOUBLE_CLICK_ZOOM_FILL,
  DOUBLE_CLICK_ZOOM_MAX,
} from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/constants';
import {
  getGroupKey,
  makeViewport,
} from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/utils/geometry';
import {
  samplePointer,
  samplePointerOrZero,
  screenDistSq,
} from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/utils/pointerMath';

interface UseCanvasPointerHandlersArgs {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  transformRef: React.MutableRefObject<CanvasTransform | null>;
  renderPlan: ArchitecturalPlan;
  layers: Record<string, boolean>;

  isPanning: boolean;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUpOrLeave: (e?: React.MouseEvent<HTMLCanvasElement>) => void;

  isMiddlePanningRef: React.MutableRefObject<boolean>;
  isSpacePanningRef: React.MutableRefObject<boolean>;
  isPanModePanningRef: React.MutableRefObject<boolean>;
  isSpaceDown: boolean;
  panMode: boolean;

  dragStartWorldRef: React.MutableRefObject<{ x: number; y: number } | null>;
  dragCurrentWorldRef: React.MutableRefObject<{ x: number; y: number } | null>;
  isDragRectRef: React.MutableRefObject<boolean>;
  dragStartScreenRef: React.MutableRefObject<{ x: number; y: number } | null>;
  setDragTick: React.Dispatch<React.SetStateAction<number>>;

  hoveredId: string | null;
  setHoveredId: React.Dispatch<React.SetStateAction<string | null>>;
  hoverRafRef: React.MutableRefObject<number | null>;
  pendingHoverPointRef: React.MutableRefObject<{ x: number; y: number } | null>;

  setSnapResult: (r: any) => void;

  currentTool: string;
  isDrawingTool: boolean;
  isReadOnly: boolean;
  getActiveToolInstance: () => any;
  toolManager: any;
  toolContext: any;
  toolManagerKnowsTool: (toolId: string) => boolean;

  zoomSurface: {
    zoomToRect: (rect: { minX: number; minY: number; maxX: number; maxY: number }, opts?: any) => void;
  };
}

export interface CanvasPointerHandlers {
  handlePointerDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handlePointerMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handlePointerUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseLeave: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleDoubleClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

export function useCanvasPointerHandlers(args: UseCanvasPointerHandlersArgs): CanvasPointerHandlers {
  const dispatch = useAppDispatch();
  const {
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
  } = args;

  const getViewport = useCallback((): Viewport | null => {
    return transformRef.current ? makeViewport(transformRef.current) : null;
  }, [transformRef]);

  const getSnapped = useCallback(
    (sample: { screenX: number; screenY: number; rawWorldX: number; rawWorldY: number }) => {
      let finalWorld = { x: sample.rawWorldX, y: sample.rawWorldY };
      let snap: any = null;

      const viewport = getViewport();
      if (viewport) {
        snap = SnapService.getSnappedPoint(
          sample.screenX,
          sample.screenY,
          sample.rawWorldX,
          sample.rawWorldY,
          viewport,
        );
        if (snap && snap.type !== null) {
          finalWorld = snap.point;
          setSnapResult(snap);
          FloorPlanSnapHook.updateSnapTarget(finalWorld, viewport);
        } else {
          setSnapResult(null);
          FloorPlanSnapHook.clear();
        }
      }
      return { finalWorld, snap };
    },
    [getViewport, setSnapResult],
  );

  const handlePointerDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const sample = samplePointer(e, canvasRef.current, transformRef.current);
      if (!sample) return;
      const { screenX, screenY, rawWorldX, rawWorldY } = sample;

      if (e.button === MOUSE_RIGHT) return;

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

      if (isReadOnly) return;
      if (e.button !== MOUSE_LEFT) return;

      if (currentTool === 'select' && !isPanning) {
        dragStartWorldRef.current = { x: rawWorldX, y: rawWorldY };
        dragCurrentWorldRef.current = { x: rawWorldX, y: rawWorldY };
        dragStartScreenRef.current = { x: screenX, y: screenY };
        isDragRectRef.current = true;
        setDragTick((t) => t + 1);
        return;
      }

      if (isPanning || !isDrawingTool) return;

      const { finalWorld, snap } = getSnapped(sample);

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
        return;
      }

      if (toolManagerKnowsTool(currentTool) && toolManager) {
        const viewport = getViewport();
        if (viewport) (toolManager as any).viewport = viewport;
        if (toolContext) (toolManager as any).context = toolContext;
        if (typeof toolManager.onPointerDown === 'function') {
          toolManager.onPointerDown({
            screenX,
            screenY,
            worldX: finalWorld.x,
            worldY: finalWorld.y,
            button: e.button,
            originalEvent: e,
            snapType: snap?.type ?? null,
            document: renderPlan,
            viewport,
          });
        }
      }
    },
    [
      canvasRef,
      transformRef,
      isPanning,
      handleMouseDown,
      isMiddlePanningRef,
      isSpacePanningRef,
      isPanModePanningRef,
      isSpaceDown,
      panMode,
      isReadOnly,
      currentTool,
      dragStartWorldRef,
      dragCurrentWorldRef,
      dragStartScreenRef,
      isDragRectRef,
      setDragTick,
      isDrawingTool,
      getSnapped,
      getActiveToolInstance,
      toolManager,
      toolContext,
      toolManagerKnowsTool,
      renderPlan,
      getViewport,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (
        isMiddlePanningRef.current ||
        isSpacePanningRef.current ||
        isPanModePanningRef.current
      ) {
        handleMouseMove(e);
        return;
      }

      handleMouseMove(e);

      const sample = samplePointer(e, canvasRef.current, transformRef.current);
      if (!sample) return;
      const { screenX, screenY, rawWorldX, rawWorldY } = sample;

      if (isReadOnly) {
        if (hoveredId !== null) setHoveredId(null);
        return;
      }

      if (isDragRectRef.current && dragStartWorldRef.current && dragStartScreenRef.current) {
        const movedEnough =
          screenDistSq(
            { x: screenX, y: screenY },
            dragStartScreenRef.current,
          ) >= DRAG_DEAD_ZONE_PX * DRAG_DEAD_ZONE_PX;

        if (movedEnough) {
          dragCurrentWorldRef.current = { x: rawWorldX, y: rawWorldY };
          setDragTick((t) => t + 1);
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
            setHoveredId((prev) => (prev === hitId ? prev : hitId));
          });
        }
        return;
      }

      if (hoveredId !== null) setHoveredId(null);

      if (isPanning || !isDrawingTool) return;

      const { finalWorld, snap } = getSnapped(sample);

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
        return;
      }

      if (toolManagerKnowsTool(currentTool) && toolManager) {
        const viewport = getViewport();
        if (viewport) (toolManager as any).viewport = viewport;
        if (toolContext) (toolManager as any).context = toolContext;
        if (typeof toolManager.onPointerMove === 'function') {
          toolManager.onPointerMove({
            screenX,
            screenY,
            worldX: finalWorld.x,
            worldY: finalWorld.y,
            originalEvent: e,
            snapType: snap?.type ?? null,
            document: renderPlan,
            viewport,
          });
        }
      }
    },
    [
      canvasRef,
      transformRef,
      handleMouseMove,
      isMiddlePanningRef,
      isSpacePanningRef,
      isPanModePanningRef,
      isReadOnly,
      hoveredId,
      setHoveredId,
      isDragRectRef,
      dragStartWorldRef,
      dragStartScreenRef,
      dragCurrentWorldRef,
      setDragTick,
      currentTool,
      isPanning,
      hoverRafRef,
      pendingHoverPointRef,
      renderPlan,
      layers,
      isDrawingTool,
      getSnapped,
      getActiveToolInstance,
      toolManager,
      toolContext,
      toolManagerKnowsTool,
      getViewport,
    ],
  );

  const handlePointerUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      isMiddlePanningRef.current = false;
      isSpacePanningRef.current = false;
      isPanModePanningRef.current = false;

      if (isDragRectRef.current && dragStartWorldRef.current && dragStartScreenRef.current) {
        const sample = samplePointerOrZero(e, canvasRef.current, transformRef.current);
        const { screenX, screenY } = sample;
        const startScreen = dragStartScreenRef.current;

        const dragDistSq = screenDistSq(
          { x: screenX, y: screenY },
          startScreen,
        );

        const startWorld = dragStartWorldRef.current;
        isDragRectRef.current = false;
        dragStartWorldRef.current = null;
        dragCurrentWorldRef.current = null;
        dragStartScreenRef.current = null;

        if (dragDistSq < DRAG_DEAD_ZONE_PX * DRAG_DEAD_ZONE_PX) {
          const tf = transformRef.current;
          if (tf) {
            const toleranceWorld = HIT_TEST_TOLERANCE_PX / tf.finalScale;
            const hit = hitTestElements(
              startWorld.x,
              startWorld.y,
              renderPlan,
              toleranceWorld,
              layers,
            );

            if (hit.element) {
              const el = hit.element;
              const group =
                Array.isArray(hit.group) && hit.group.length > 0 ? hit.group : [el];

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
              dispatch(clearMultiSelection());
            }
          }
          setDragTick((t) => t + 1);
          window.dispatchEvent(new CustomEvent('sbs:canvas-update'));
          handleMouseUpOrLeave(e);
          return;
        }

        const tf = transformRef.current;
        let cWorld: { x: number; y: number };
        if (tf) {
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

        setDragTick((t) => t + 1);
        window.dispatchEvent(new CustomEvent('sbs:canvas-update'));
        handleMouseUpOrLeave(e);
        return;
      }

      if (toolManagerKnowsTool(currentTool) && toolManager) {
        const sample = samplePointerOrZero(e, canvasRef.current, transformRef.current);
        if (typeof toolManager.onPointerUp === 'function') {
          toolManager.onPointerUp({
            screenX: sample.screenX,
            screenY: sample.screenY,
            worldX: sample.rawWorldX,
            worldY: sample.rawWorldY,
            button: e.button,
            originalEvent: e,
            document: renderPlan,
            viewport: getViewport(),
          });
        }
      }

      handleMouseUpOrLeave(e);
    },
    [
      canvasRef,
      transformRef,
      isMiddlePanningRef,
      isSpacePanningRef,
      isPanModePanningRef,
      isDragRectRef,
      dragStartWorldRef,
      dragCurrentWorldRef,
      dragStartScreenRef,
      renderPlan,
      layers,
      dispatch,
      setDragTick,
      handleMouseUpOrLeave,
      toolManager,
      toolManagerKnowsTool,
      currentTool,
      getViewport,
    ],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (hoveredId !== null) setHoveredId(null);
      isMiddlePanningRef.current = false;
      isSpacePanningRef.current = false;
      isPanModePanningRef.current = false;

      if (isDragRectRef.current) {
        isDragRectRef.current = false;
        dragStartWorldRef.current = null;
        dragCurrentWorldRef.current = null;
        dragStartScreenRef.current = null;
        setDragTick((t) => t + 1);
      }

      if (toolManagerKnowsTool(currentTool) && toolManager && typeof toolManager.onPointerLeave === 'function') {
        toolManager.onPointerLeave({ originalEvent: e, document: renderPlan });
      }

      handleMouseUpOrLeave(e);
    },
    [
      hoveredId,
      setHoveredId,
      isMiddlePanningRef,
      isSpacePanningRef,
      isPanModePanningRef,
      isDragRectRef,
      dragStartWorldRef,
      dragCurrentWorldRef,
      dragStartScreenRef,
      setDragTick,
      toolManagerKnowsTool,
      toolManager,
      currentTool,
      renderPlan,
      handleMouseUpOrLeave,
    ],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const tf = transformRef.current;
      if (!tf) return;
      const sample = samplePointerOrZero(e, canvasRef.current, tf);
      const { screenX, screenY, rawWorldX, rawWorldY } = sample;

      const isGeometryToolId =
        currentTool === 'wall' ||
        currentTool === 'room' ||
        currentTool === 'door' ||
        currentTool === 'window';

      if (isGeometryToolId) {
        if (isReadOnly) return;
        const activeToolInstance = getActiveToolInstance();
        if (!activeToolInstance || typeof (activeToolInstance as any).onDoubleClick !== 'function') {
          return;
        }
        (activeToolInstance as any).onDoubleClick({
          screenX,
          screenY,
          worldX: rawWorldX,
          worldY: rawWorldY,
          originalEvent: e,
        });
        return;
      }

      if (currentTool !== 'select') return;

      const toleranceWorld = HIT_TEST_TOLERANCE_PX / tf.finalScale;
      const hit = hitTestElements(rawWorldX, rawWorldY, renderPlan, toleranceWorld, layers);
      if (!hit.element) return;

      const group = Array.isArray(hit.group) && hit.group.length > 0 ? hit.group : [hit.element];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const el of group) {
        const pts =
          (el as any).points ||
          (el as any).vertices ||
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

      const w = maxX - minX;
      const h = maxY - minY;
      if (w < 20) { const cx = (minX + maxX) / 2; minX = cx - 10; maxX = cx + 10; }
      if (h < 20) { const cy = (minY + maxY) / 2; minY = cy - 10; maxY = cy + 10; }

      zoomSurface.zoomToRect(
        { minX, minY, maxX, maxY },
        { fill: DOUBLE_CLICK_ZOOM_FILL, maxZoom: DOUBLE_CLICK_ZOOM_MAX },
      );
    },
    [
      canvasRef,
      transformRef,
      currentTool,
      isReadOnly,
      getActiveToolInstance,
      renderPlan,
      layers,
      zoomSurface,
    ],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  }, []);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleMouseLeave,
    handleDoubleClick,
    handleContextMenu,
  };
}