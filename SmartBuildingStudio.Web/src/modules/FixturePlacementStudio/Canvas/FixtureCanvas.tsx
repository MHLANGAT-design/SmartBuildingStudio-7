// src/modules/FixturePlacementStudio/Canvas/FixtureCanvas.tsx
//
// Pan architecture (standardised with FPD):
//   • Middle-drag                → pan (CAD convention)
//   • Space + left-drag          → pan (2D-tool convention)
//   • Hand tool (GlobalZoomControl) → left-drag pans while active
//   • Right-click                → ignored (reserved for future context menu)
//   • Left-click on empty canvas → deselect only, NO pan
//
// Zoom surface: registers a ZoomableSurface. Double-click on a
// fixture → zoomToRect to centre it at ~40% canvas fill.
//
// LEVEL 1 LOCK ENFORCEMENT:
//   When the backend reports isLocked && lockedByUsername !== CURRENT_USER,
//   the canvas enters read-only mode: pan / zoom only, no fixture
//   placement, no dragging, no deletion. A yellow banner at the top
//   tells the user who holds the lock.
//
// No render-path changes.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/Application/ConfigureStore';
import { CanvasRenderer } from '@/modules/FloorPlanDesigner/Components/Canvas/CanvasRenderer';
import {
  computeViewTransform,
  makeViewport,
  computeBounds,
  type ViewTransform,
} from '@/modules/Shared/Canvas/Transform';
import { useFixtureCanvasPan } from '@/modules/FixturePlacementStudio/hooks/useFixtureCanvasPan';
import { useFixtureCanvasZoom } from '@/modules/FixturePlacementStudio/hooks/useFixtureCanvasZoom';
import { useFixtureLockState } from '@/modules/FixturePlacementStudio/hooks/useFixtureLockState';
import { usePlacementLayer } from '@/modules/FixturePlacementStudio/Canvas/PlacementLayer';
import { findRoomAtPoint } from '@/modules/FixturePlacementStudio/utils/findRoomAtPoint';
import {
  buildRoomTopology,
  findRoomContaining,
} from '@/modules/FixturePlacementStudio/utils/roomTopology';
import { drawPhotometricHeatmap } from '@/modules/FixturePlacementStudio/Canvas/Layers/PhotometricLayer';

import { drawGridLayer } from '@/modules/FixturePlacementStudio/Canvas/Layers/GridLayer';
import { drawRoomLayer } from '@/modules/FixturePlacementStudio/Canvas/Layers/RoomLayer';
import { drawZoneLayer } from '@/modules/FixturePlacementStudio/Canvas/Layers/ZoneLayer';
import { drawFixtureLayer } from '@/modules/FixturePlacementStudio/Canvas/Layers/FixtureLayer';
import { drawSelectionLayer } from '@/modules/FixturePlacementStudio/Canvas/Layers/SelectionLayer';
import { drawPlacementGhostLayer } from '@/modules/FixturePlacementStudio/Canvas/Layers/PlacementGhostLayer';
import { drawMeasurementLayer } from '@/modules/FixturePlacementStudio/Canvas/Layers/MeasurementLayer';
import { drawSnapLayer } from '@/modules/FixturePlacementStudio/Canvas/Layers/SnapLayer';

import {
  selectLayout,
  selectFixtures,
  selectZones,
  selectSelectedFixtureIds,
  selectSelectedZoneIds,
  selectHeatmapVisible,
  selectLatestPhotometricCalculation,
  selectLayerVisibility,
} from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import {
  setSelection,
  clearSelection,
  setPlacementProduct,
  deleteFixtures,
  setFixturePositionAndRoom,
  setSelectedRoomId,
} from '@/modules/FixturePlacementStudio/store/fixtureSlice';
import type { Fixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import type { DrawingDocument } from '@/modules/FloorPlanDesigner/Document/DrawingDocument';
import { useZoomSurface } from '@/modules/Shared/Zoom/zoomRegistry';
import type { ZoomableSurface, WorldRect } from '@/modules/Shared/Zoom/zoomSurface';
import { usePanMode } from '@/modules/Shared/Zoom/panMode';

// ─── Layout constants ────────────────────────────────────────────────────────

const HIT_RADIUS_PX = 12;
const MIN_BOUNDS_SPAN = 100;
const DRAG_DEAD_ZONE_PX = 4;

const MOUSE_LEFT = 0;
const MOUSE_MIDDLE = 1;
const MOUSE_RIGHT = 2;

// FPS zoom tuning — must match useFixtureCanvasZoom.ts.
const ZOOM_STEP = 0.15;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 20;

const DOUBLE_CLICK_ZOOM_FILL = 0.4;
const DOUBLE_CLICK_ZOOM_MAX = 4;
const DOUBLE_CLICK_FIXTURE_BOX = 20; // world-unit half-extent around a fixture

interface DragState {
  fixtureId: string;
  worldX: number;
  worldY: number;
  startScreenX: number;
  startScreenY: number;
  moved: boolean;
}

export const FixtureCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef<ViewTransform | null>(null);

  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  const dragRef = useRef<DragState | null>(null);
  const [dragTick, setDragTick] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dispatch = useAppDispatch();
  const {
    offset,
    setOffset,
    isPanning,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
  } = useFixtureCanvasPan();
  const { scale, setZoom, handleWheel } = useFixtureCanvasZoom();
  const panMode = usePanMode();

  // ── Lock state (Level 1 enforcement) ─────────────────────────────
  const { isReadOnly, lockedByUsername } = useFixtureLockState();

  const layout = useAppSelector(selectLayout);
  const fixtures = useAppSelector(selectFixtures);
  const zones = useAppSelector(selectZones);
  const selectedFixtureIds = useAppSelector(selectSelectedFixtureIds);
  const selectedZoneIds = useAppSelector(selectSelectedZoneIds);
  const heatmapVisible = useAppSelector(selectHeatmapVisible);
  const photometricCalculation = useAppSelector(selectLatestPhotometricCalculation);
  const layerVisibility = useAppSelector(selectLayerVisibility);
  const selectedFixtureSet = useMemo(
    () => new Set(selectedFixtureIds),
    [selectedFixtureIds]
  );

  // Pan gesture tracking (mirrors FPD's flags).
  const isMiddlePanningRef = useRef(false);
  const isSpacePanningRef = useRef(false);
  const isPanModePanningRef = useRef(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);

  // ── Zoom surface registration ─────────────────────────────────────
  const zoomSurface = useMemo<ZoomableSurface>(() => ({
    moduleName: 'Fixture Placement Studio',
    getZoom: () => scale,
    setZoom: (z: number) => {
      setZoom(z);
    },
    zoomIn: () => {
      setZoom(scale + ZOOM_STEP);
    },
    zoomOut: () => {
      setZoom(scale - ZOOM_STEP);
    },
    fitToContent: () => {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    },
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
      const targetZoom = Math.min(
        Math.max(rawTarget, minZoom),
        Math.min(maxZoom, ZOOM_MAX)
      );
      if (!Number.isFinite(targetZoom) || targetZoom <= 0) return;

      const newFinalScale = naturalScaleX * targetZoom;
      const newYScale = CanvasRenderer.flipY ? -newFinalScale : newFinalScale;

      const worldCx = (rect.minX + rect.maxX) / 2;
      const worldCy = (rect.minY + rect.maxY) / 2;

      const newOffsetX = -(worldCx - tf.centerX) * newFinalScale;
      const newOffsetY = -(worldCy - tf.centerY) * newYScale;

      const dpr = window.devicePixelRatio || 1;
      setZoom(targetZoom);
      setOffset({ x: newOffsetX / dpr, y: newOffsetY / dpr });
    },
  }), [scale, setZoom, setOffset]);

  useZoomSurface(zoomSurface);

  const [drawingDocRevision, setDrawingDocRevision] = useState(0);

  const placement = usePlacementLayer();

  const drawingDocument = useMemo<DrawingDocument | null>(() => {
    if (!layout) return null;
    const reg = (window as any).__fixtureSessionRegistry;
    if (!reg) return null;
    const session = reg.get?.(layout.documentId);
    return session?.fixtureDocument?.getDrawingDocument?.() ?? null;
  }, [layout]);

  useEffect(() => {
    setDrawingDocRevision((r) => r + 1);
  }, [fixtures]);

  const roomTopology = useMemo(() => {
    if (!drawingDocument) return null;
    return buildRoomTopology(drawingDocument);
  }, [drawingDocument]);

  useEffect(() => {
    const win = window as any;
    const previous = win.__hiddenLayersMap;
    win.__hiddenLayersMap = {};
    return () => {
      win.__hiddenLayersMap = previous;
    };
  }, []);

  // ── Keyboard: Space → pan cursor ─────────────────────────────────
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
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.isContentEditable)
      ) {
        return;
      }
      if (placement.isActive) {
        e.preventDefault();
        dispatch(setPlacementProduct(null));
        placement.setCursor(null);
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [dispatch, placement]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Read-only: block Delete / Backspace.
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
      if (selectedFixtureIds.length === 0) return;
      e.preventDefault();
      dispatch(deleteFixtures({ fixtureIds: selectedFixtureIds }));
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [dispatch, selectedFixtureIds, isReadOnly]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setCanvasSize({
        width: Math.max(200, Math.floor(rect.width)),
        height: Math.max(200, Math.floor(rect.height)),
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      handleWheel(e as unknown as React.WheelEvent<HTMLCanvasElement>);
    };
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, [handleWheel]);

  // ── Render loop ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;

    let bounds = { minX: -10000, minY: -10000, maxX: 10000, maxY: 10000 };

    if (drawingDocument) {
      const elements = drawingDocument.getElements();
      const geoPoints: { x: number; y: number }[] = [];
      for (const el of elements) {
        const pts =
          (el as any).points ||
          (el as any).vertices ||
          ((el as any).start && (el as any).end
            ? [(el as any).start, (el as any).end]
            : []);
        if (!Array.isArray(pts)) continue;
        for (const p of pts) {
          if (p && typeof p.x === 'number' && typeof p.y === 'number') {
            geoPoints.push(p);
          }
        }
      }
      if (geoPoints.length > 0) {
        bounds = computeBounds(geoPoints, bounds);
      }
    } else if (fixtures.length > 0) {
      bounds = computeBounds(
        fixtures.map((f) => ({ x: f.x, y: f.y })),
        bounds
      );
    }

    if (bounds.maxX - bounds.minX < MIN_BOUNDS_SPAN) {
      const cx = (bounds.minX + bounds.maxX) / 2;
      bounds.minX = cx - MIN_BOUNDS_SPAN / 2;
      bounds.maxX = cx + MIN_BOUNDS_SPAN / 2;
    }
    if (bounds.maxY - bounds.minY < MIN_BOUNDS_SPAN) {
      const cy = (bounds.minY + bounds.maxY) / 2;
      bounds.minY = cy - MIN_BOUNDS_SPAN / 2;
      bounds.maxY = cy + MIN_BOUNDS_SPAN / 2;
    }

    const tf = computeViewTransform({
      bounds,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      zoom: scale,
      offsetX: offset.x * dpr,
      offsetY: offset.y * dpr,
      padding: 60,
      flipY: true,
    });
    transformRef.current = tf;
    const viewport = makeViewport(tf);

    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let hasPlanBackground = false;
    if (drawingDocument) {
      try {
        const elements = drawingDocument.getElements();
        if (elements && elements.length > 0) {
          hasPlanBackground = true;

          const fpsFixtureIds = new Set(fixtures.map((f) => String(f.id)));
          const elementsForBackground = elements.filter((el: any) => {
            const type = String(el?.type ?? '').toLowerCase();
            if (type !== 'fixture' && type !== 'fixtures') return true;
            return !fpsFixtureIds.has(String(el?.id ?? ''));
          });

          const planLike = {
            elements: elementsForBackground as any[],
            walls: drawingDocument.getWalls(),
            doors: drawingDocument.getDoors(),
          };

          CanvasRenderer.flipY = true;
          CanvasRenderer.clearAndDraw(
            ctx,
            canvas.width,
            canvas.height,
            planLike as any,
            scale,
            { x: offset.x * dpr, y: offset.y * dpr },
            {
              showDimensions: false,
              layers: {
                walls: true,
                doors: true,
                windows: true,
                rooms: true,
              },
              selectedId: null,
              hoveredId: null,
              flipY: true,
            }
          );
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[FixtureCanvas] Floor-plan render failed:', err);
      }
    }

    if (!hasPlanBackground && layerVisibility.grid) {
      drawGridLayer(ctx, tf);
    }

    if (layerVisibility.heatmap && heatmapVisible && photometricCalculation) {
      try {
        drawPhotometricHeatmap(ctx, viewport, tf, photometricCalculation, null);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[FixtureCanvas] Photometric heatmap render failed:', err);
      }
    }

    if (layerVisibility.rooms) {
      drawRoomLayer(ctx, drawingDocument, viewport, tf);
    }

    if (layerVisibility.zones) {
      drawZoneLayer(ctx, zones, fixtures, viewport, selectedZoneIds);
    }

    const draggedId = dragRef.current?.moved ? dragRef.current.fixtureId : null;
    const fixturesToDraw = draggedId
      ? fixtures.filter((f) => f.id !== draggedId)
      : fixtures;
    if (layerVisibility.fixtures) {
      drawFixtureLayer(ctx, fixturesToDraw, viewport, selectedFixtureSet);
    }

    if (
      layerVisibility.selection &&
      dragRef.current &&
      dragRef.current.moved
    ) {
      const dragged = fixtures.find((f) => f.id === dragRef.current!.fixtureId);
      if (dragged) {
        drawSelectionLayer(
          ctx,
          viewport,
          dragged,
          dragRef.current.worldX,
          dragRef.current.worldY
        );
      }
    }

    if (
      layerVisibility.placement &&
      placement.isActive &&
      placement.cursor &&
      !isReadOnly
    ) {
      drawPlacementGhostLayer(ctx, viewport, placement.cursor);
    }

    if (layerVisibility.measurements) {
      drawMeasurementLayer(ctx, viewport, null);
    }

    if (layerVisibility.snap) {
      drawSnapLayer(ctx, viewport, null);
    }
  }, [
    fixtures,
    zones,
    selectedFixtureSet,
    selectedZoneIds,
    scale,
    offset,
    canvasSize,
    drawingDocument,
    drawingDocRevision,
    placement.isActive,
    placement.cursor,
    dragTick,
    heatmapVisible,
    photometricCalculation,
    layerVisibility,
    isReadOnly,
  ]);

  // ── Pointer handling ─────────────────────────────────────────────
  const screenToWorld = (
    clientX: number,
    clientY: number
  ): { worldX: number; worldY: number } | null => {
    const canvas = canvasRef.current;
    const tf = transformRef.current;
    if (!canvas || !tf) return null;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const screenX = (clientX - rect.left) * dpr;
    const screenY = (clientY - rect.top) * dpr;
    return {
      worldX: (screenX - tf.width / 2 - tf.offsetX) / tf.finalScale + tf.centerX,
      worldY: (screenY - tf.height / 2 - tf.offsetY) / tf.yScale + tf.centerY,
    };
  };

  const hitTestFixturesLocal = (
    fixtures: Fixture[],
    screenX: number,
    screenY: number,
    tf: ViewTransform,
    radiusScreenPx: number
  ): string | null => {
    for (let i = fixtures.length - 1; i >= 0; i--) {
      const f = fixtures[i];
      const p = {
        x: tf.width / 2 + tf.offsetX + (f.x - tf.centerX) * tf.finalScale,
        y: tf.height / 2 + tf.offsetY + (f.y - tf.centerY) * tf.yScale,
      };
      if (Math.hypot(p.x - screenX, p.y - screenY) <= radiusScreenPx) {
        return f.id;
      }
    }
    return null;
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const world = screenToWorld(e.clientX, e.clientY);
    const tf = transformRef.current;
    const canvas = canvasRef.current;
    if (!world || !tf || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const screenX = (e.clientX - rect.left) * dpr;
    const screenY = (e.clientY - rect.top) * dpr;

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

    if (e.button !== MOUSE_LEFT) return;

    // ── Read-only: block all remaining left-click edit gestures ────
    if (isReadOnly) return;

    if (placement.isActive) {
      e.preventDefault();
      const roomId = findRoomAtPoint(drawingDocument, world.worldX, world.worldY);
      placement.commit(world, roomId);
      return;
    }

    const hitFixtureId = hitTestFixturesLocal(
      fixtures,
      screenX,
      screenY,
      tf,
      HIT_RADIUS_PX * dpr
    );

    if (hitFixtureId) {
      e.preventDefault();
      const alreadySelected = selectedFixtureSet.has(hitFixtureId);
      if (!alreadySelected) {
        dispatch(setSelection({ fixtureIds: [hitFixtureId], zoneIds: [] }));
      }
      dragRef.current = {
        fixtureId: hitFixtureId,
        worldX: world.worldX,
        worldY: world.worldY,
        startScreenX: screenX,
        startScreenY: screenY,
        moved: false,
      };
      return;
    }

    const roomHit = roomTopology
      ? findRoomContaining(roomTopology, world.worldX, world.worldY)
      : null;

    if (roomHit) {
      e.preventDefault();
      dispatch(setSelectedRoomId(roomHit.roomId));
      return;
    }

    if (selectedFixtureIds.length > 0 || selectedZoneIds.length > 0) {
      dispatch(clearSelection());
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const tf = transformRef.current;
    if (!canvas || !tf) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const screenX = (e.clientX - rect.left) * dpr;
    const screenY = (e.clientY - rect.top) * dpr;

    // ── Read-only: skip drag and placement cursor ─────────────────
    if (isReadOnly) {
      if (isPanning) handleMouseMove(e);
      return;
    }

    const drag = dragRef.current;
    if (drag) {
      const dx = screenX - drag.startScreenX;
      const dy = screenY - drag.startScreenY;
      const dist = Math.hypot(dx, dy);

      if (!drag.moved && dist >= DRAG_DEAD_ZONE_PX) {
        drag.moved = true;
        setIsDragging(true);
      }

      if (drag.moved) {
        const world = screenToWorld(e.clientX, e.clientY);
        if (world) {
          drag.worldX = world.worldX;
          drag.worldY = world.worldY;
          setDragTick((t) => t + 1);
        }
        return;
      }
    }

    if (placement.isActive) {
      const world = screenToWorld(e.clientX, e.clientY);
      placement.setCursor(world);
    }

    if (isPanning) handleMouseMove(e);
  };

  const handlePointerUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isMiddlePanningRef.current = false;
    isSpacePanningRef.current = false;
    isPanModePanningRef.current = false;

    const drag = dragRef.current;
    if (drag) {
      if (drag.moved && !isReadOnly) {
        const roomId = findRoomAtPoint(drawingDocument, drag.worldX, drag.worldY);
        dispatch(
          setFixturePositionAndRoom({
            fixtureId: drag.fixtureId,
            x: drag.worldX,
            y: drag.worldY,
            roomId,
          })
        );
      }
      dragRef.current = null;
      setIsDragging(false);
      setDragTick((t) => t + 1);
    }
    handleMouseUpOrLeave(e);
  };

  const handlePointerLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isMiddlePanningRef.current = false;
    isSpacePanningRef.current = false;
    isPanModePanningRef.current = false;

    if (dragRef.current) {
      dragRef.current = null;
      setIsDragging(false);
      setDragTick((t) => t + 1);
    }
    if (placement.isActive) placement.setCursor(null);
    handleMouseUpOrLeave(e);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Zoom-to-fixture is a viewing operation — allowed in read-only.
    const canvas = canvasRef.current;
    const tf = transformRef.current;
    if (!canvas || !tf) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const screenX = (e.clientX - rect.left) * dpr;
    const screenY = (e.clientY - rect.top) * dpr;

    const hitId = hitTestFixturesLocal(fixtures, screenX, screenY, tf, HIT_RADIUS_PX * dpr);
    if (!hitId) return;

    const fixture = fixtures.find((f) => f.id === hitId);
    if (!fixture) return;

    const R = DOUBLE_CLICK_FIXTURE_BOX;
    zoomSurface.zoomToRect(
      { minX: fixture.x - R, maxX: fixture.x + R, minY: fixture.y - R, maxY: fixture.y + R },
      { fill: DOUBLE_CLICK_ZOOM_FILL, maxZoom: DOUBLE_CLICK_ZOOM_MAX }
    );
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {isReadOnly && (
        <div style={readOnlyBanner}>
          <span>🔒</span>
          <span>
            Read-only — locked by {lockedByUsername || 'another user'}. Pan and zoom only.
          </span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerLeave}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        style={{
          display: 'block',
          background: '#0A0A0A',
          cursor: isReadOnly
            ? isPanning
              ? 'grabbing'
              : panMode || isSpaceDown
              ? 'grab'
              : 'default'
            : isMiddlePanningRef.current || isSpacePanningRef.current || isPanModePanningRef.current
            ? 'grabbing'
            : panMode || isSpaceDown
            ? 'grab'
            : placement.isActive
            ? 'copy'
            : isDragging
            ? 'grabbing'
            : isPanning
            ? 'grabbing'
            : 'crosshair',
        }}
      />

      {layout && fixtures.length === 0 && !placement.isActive && !isReadOnly && (
        <div style={emptyOverlay}>
          <div style={{ fontSize: 12, color: '#64748B' }}>
            No fixtures placed yet.
          </div>
          <div style={{ fontSize: 10, color: '#334155', marginTop: 4 }}>
            Pick a product from the Fixture Library to place one.
          </div>
        </div>
      )}

      {placement.isActive && !isReadOnly && (
        <div style={placementOverlay}>Click to place · Esc to cancel</div>
      )}
    </div>
  );
};

const readOnlyBanner: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  padding: '8px 12px',
  background: 'rgba(255, 184, 0, 0.15)',
  borderBottom: '1px solid rgba(255, 184, 0, 0.4)',
  color: '#FFB800',
  fontSize: 10,
  fontFamily: 'monospace',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  zIndex: 5,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  pointerEvents: 'none',
};

const emptyOverlay: React.CSSProperties = {
  position: 'absolute',
  bottom: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '8px 16px',
  background: 'rgba(11, 15, 25, 0.9)',
  border: '1px solid #1E293B',
  borderRadius: 4,
  textAlign: 'center',
  pointerEvents: 'none',
};

const placementOverlay: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '4px 12px',
  background: 'rgba(56, 189, 248, 0.15)',
  border: '1px solid rgba(56, 189, 248, 0.4)',
  borderRadius: 3,
  fontSize: 10,
  color: '#7DD3FC',
  fontFamily: 'monospace',
  pointerEvents: 'none',
};

export default FixtureCanvas;