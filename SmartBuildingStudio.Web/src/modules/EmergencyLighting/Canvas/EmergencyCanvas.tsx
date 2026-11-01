// src/modules/EmergencyLighting/Canvas/EmergencyCanvas.tsx

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { CanvasRenderer } from '@/modules/FloorPlanDesigner/Components/Canvas/CanvasRenderer';
import { useEmergencyCanvasPan } from '@/modules/EmergencyLighting/hooks/useEmergencyCanvasPan';
import { useEmergencyCanvasZoom } from '@/modules/EmergencyLighting/hooks/useEmergencyCanvasZoom';
import { useEvacuationRoutes } from '@/modules/EmergencyLighting/hooks/useEvacuationRoutes';
import { EvacuationRouteLayer } from '@/modules/EmergencyLighting/Canvas/EvacuationRouteLayer';
import { HeatmapLayer } from '@/modules/EmergencyLighting/Canvas/HeatmapLayer';
import { HeatmapLegend } from '@/modules/EmergencyLighting/Canvas/HeatmapLegend';
import { ComplianceOverlay } from '@/modules/EmergencyLighting/Canvas/ComplianceOverlay';
import { CoverageZoneLayer } from '@/modules/EmergencyLighting/Canvas/CoverageZoneLayer';
import { VisibilityConeLayer } from '@/modules/EmergencyLighting/Canvas/VisibilityConeLayer';
import { PathFindingLayer } from '@/modules/EmergencyLighting/Canvas/PathFindingLayer';
import { EmergencyFixtureLayer } from '@/modules/EmergencyLighting/Canvas/EmergencyFixtureLayer';
import { ExitSignLayer } from '@/modules/EmergencyLighting/Canvas/ExitSignLayer';
import {
  setSelectedRouteId,
  clearSelectedRouteId,
  removeEvacuationRouteAction,
  removeRouteElementAction,
  clearFocusRequest,
} from '@/modules/EmergencyLighting/store/emergencySlice';
import { runEmergencySimulation } from '@/modules/EmergencyLighting/store/emergencyThunks';
import { selectEmergencyFixtureById } from '@/modules/EmergencyLighting/store/emergencySelectors';
import { useZoomSurface } from '@/modules/Shared/Zoom/zoomRegistry';
import type { ZoomableSurface } from '@/modules/Shared/Zoom/zoomSurface';

const OUTLIER_RADIUS = 500_000;
const MIN_CANVAS_DIM = 200;
const ROUTE_HIT_TOLERANCE_PX = 10;

function getPoints(el: any): Array<{ x: number; y: number }> {
  const raw =
    (Array.isArray(el?.points) && el.points) ||
    (Array.isArray(el?.vertices) && el.vertices) ||
    (el?.start && el?.end ? [el.start, el.end] : []) ||
    (Array.isArray(el?.primitives)
      ? el.primitives.flatMap((p: any) => p?.points ?? [])
      : []) ||
    [];
  return raw.filter((p: any) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
}

function dropOutliers(elements: any[], semanticCenter: { x: number; y: number }): any[] {
  return elements.filter((el) => {
    const pts = getPoints(el);
    if (pts.length === 0) return true;
    return pts.every(
      (p) =>
        Math.abs(p.x - semanticCenter.x) <= OUTLIER_RADIUS &&
        Math.abs(p.y - semanticCenter.y) <= OUTLIER_RADIUS
    );
  });
}

function computeArea(pts: { x: number; y: number }[]): number {
  if (pts.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2 / 1_000_000;
}

function pointToSegmentPx(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-9) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export const EmergencyCanvas: React.FC = () => {
  const dispatch = useAppDispatch();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const floorplanModel = useAppSelector((s: any) => s.emergency.floorplan.model);
  const rawGeometry = useAppSelector((s: any) => s.emergency.rawGeometry.elements);
  const layers = useAppSelector((s: any) => s.emergency.layerVisibility);
  const routes = useAppSelector((s: any) => s.emergency.routes || []);
  const selectedRouteId = useAppSelector((s: any) => s.emergency.ui.selectedRouteId);
  const selectedFixtureId = useAppSelector((s: any) => s.emergency.ui.selectedEmergencyFixtureId);
  const focusRequest = useAppSelector((s: any) => s.emergency.ui.focusRequest);

  const selectedFixture = useAppSelector((s) =>
    selectEmergencyFixtureById(s, selectedFixtureId)
  );

  const routeTool = useEvacuationRoutes();

  const { offset, setOffset, isPanning, handleMouseDown, handleMouseMove, handleMouseUpOrLeave } =
    useEmergencyCanvasPan();
  const { scale, setZoom, handleWheel } = useEmergencyCanvasZoom();

  const zoomSurface = useMemo<ZoomableSurface>(() => ({
    moduleName: 'Emergency Lighting',
    getZoom: () => scale,
    setZoom: (z: number) => setZoom(z),
    zoomIn: () => setZoom(scale + 0.15),
    zoomOut: () => setZoom(scale - 0.15),
    fitToContent: () => { setZoom(1); setOffset({ x: 0, y: 0 }); },
    zoomToRect: () => {},
  }), [scale, setZoom, setOffset]);

  useZoomSurface(zoomSurface);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const parent = canvas.parentElement;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width, height });
      }
    });

    observer.observe(parent);

    return () => observer.disconnect();
  }, []);

  const combinedModel = useMemo(() => {
    if (!floorplanModel) return null;

    let cx = 0, cy = 0, count = 0;
    for (const el of floorplanModel.elements || []) {
      for (const p of getPoints(el)) { cx += p.x; cy += p.y; count++; }
    }
    const semanticCenter = count > 0 ? { x: cx / count, y: cy / count } : { x: 0, y: 0 };

    const baseElements = dropOutliers(floorplanModel.elements || [], semanticCenter);

    const elements = [...baseElements];
    if (layers.rawgeometry && rawGeometry.length > 0) {
      const cleanRaw = dropOutliers(rawGeometry, semanticCenter);
      elements.push(...cleanRaw);
    }

    return { ...floorplanModel, elements };
  }, [floorplanModel, rawGeometry, layers.rawgeometry]);

  const getProjection = (canvasWidth: number, canvasHeight: number) => {
    if (!combinedModel) return null;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let hasPoints = false;
    const processPoint = (pt: { x: number; y: number }) => {
      if (pt && typeof pt.x === 'number' && typeof pt.y === 'number') {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
        hasPoints = true;
      }
    };
    for (const el of combinedModel.elements) {
      const pts = el.points || el.vertices || (el.start && el.end ? [el.start, el.end] : []);
      if (Array.isArray(pts)) pts.forEach(processPoint);
      if (typeof el.x === 'number' && typeof el.y === 'number') processPoint({ x: el.x, y: el.y });
    }
    for (const d of (combinedModel as any).doors || []) processPoint({ x: d.hingeX, y: d.hingeY });
    if (!hasPoints) return null;

    const dxfWidth = maxX - minX || 1;
    const dxfHeight = maxY - minY || 1;
    const finalScale = Math.min((canvasWidth - 120) / dxfWidth, (canvasHeight - 120) / dxfHeight) * (scale || 1);
    if (finalScale <= 0) return null;

    const dpr = window.devicePixelRatio || 1;
    const yScale = -finalScale;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const worldToScreen = (p: { x: number; y: number }) => ({
      x: canvasWidth / 2 + offset.x * dpr + (p.x - centerX) * finalScale,
      y: canvasHeight / 2 + offset.y * dpr + (p.y - centerY) * yScale,
    });

    const screenToWorld = (p: { x: number; y: number }) => ({
      x: (p.x - canvasWidth / 2 - offset.x * dpr) / finalScale + centerX,
      y: (p.y - canvasHeight / 2 - offset.y * dpr) / yScale + centerY,
    });

    return {
      finalScale, dxfWidth, dxfHeight,
      centerX, centerY, yScale, dpr,
      worldToScreen, screenToWorld,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !combinedModel) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const cssWidth = Math.max(MIN_CANVAS_DIM, canvasSize.width || 1024);
    const cssHeight = Math.max(MIN_CANVAS_DIM, canvasSize.height || 650);

    if (canvas.width !== Math.floor(cssWidth * dpr) || canvas.height !== Math.floor(cssHeight * dpr)) {
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
    }

    if (!Array.isArray(combinedModel.elements) || combinedModel.elements.length === 0) return;

    CanvasRenderer.flipY = true;
    try {
      CanvasRenderer.clearAndDraw(
        ctx, canvas.width, canvas.height, combinedModel, scale,
        { x: offset.x * dpr, y: offset.y * dpr },
        {
          showDimensions: false,
          layers: {
            walls: true, doors: true, windows: true, rooms: true,
            rawgeometry: layers.rawgeometry, fixtures: true,
          },
        }
      );
    } catch (err) {
      console.error('[EmergencyCanvas] clearAndDraw failed', err);
      return;
    }

    if (layers.rooms === false) return;

    const proj = getProjection(canvas.width, canvas.height);
    if (!proj) return;

    const { worldToScreen } = proj;

    const maxFont = Math.max(10, Math.min(14, canvas.width / 100));
    const fontSize = Math.max(8, Math.min(maxFont, 14));
    const lineHeight = fontSize * 1.2;

    for (const element of combinedModel.elements) {
      const type = String(element.type || '').toLowerCase();
      if (type !== 'room' && type !== 'rooms' && element.isRoom !== true) continue;

      const pts = element.points || element.vertices || [];
      if (!Array.isArray(pts) || pts.length < 3) continue;

      let cx = 0, cy = 0;
      for (const p of pts) { cx += p.x; cy += p.y; }
      cx /= pts.length;
      cy /= pts.length;

      const screenC = worldToScreen({ x: cx, y: cy });
      const areaValue = computeArea(pts);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = 'rgba(74, 222, 128, 0.95)';
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillText(element.name || 'Unnamed Room', screenC.x, screenC.y - lineHeight * 0.6);

      const lux = element.targetLux || element.lux || 500;
      const group = element.primaryGroup || element.group || 1;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = `${fontSize * 0.8}px sans-serif`;
      ctx.fillText(`${lux} lx  |  G${group}`, screenC.x, screenC.y + lineHeight * 0.4);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = `${fontSize * 0.7}px sans-serif`;
      ctx.fillText(`${areaValue.toFixed(1)} m²`, screenC.x, screenC.y + lineHeight * 1.1);

      ctx.restore();
    }
  }, [combinedModel, scale, offset, layers, canvasSize]);

  useEffect(() => {
    if (!focusRequest) return;
    const { routeId, segmentIndex } = focusRequest;
    const route = routes.find((r: any) => r.id === routeId);
    if (!route) {
      dispatch(clearFocusRequest());
      return;
    }

    const pts: Array<{ x: number; y: number }> =
      Array.isArray(route.points) && route.points.length >= 2
        ? route.points
        : [route.startNode, route.endNode];
    const a = pts[segmentIndex];
    const b = pts[segmentIndex + 1];
    if (!a || !b) {
      dispatch(clearFocusRequest());
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      dispatch(clearFocusRequest());
      return;
    }

    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const segLen = Math.hypot(b.x - a.x, b.y - a.y) || 1;

    const projNow = getProjection(canvas.width, canvas.height);
    if (!projNow) {
      dispatch(clearFocusRequest());
      return;
    }

    const shortSide = Math.min(canvas.width, canvas.height);
    const targetPx = shortSide * 0.4;
    const currentFinalScale = projNow.finalScale || 1;
    const currentZoom = scale || 1;
    const finalScalePerZoom = currentFinalScale / currentZoom;
    const desiredFinalScale = targetPx / segLen;
    const desiredZoom = desiredFinalScale / finalScalePerZoom;
    const clampedZoom = Math.max(0.5, Math.min(8, desiredZoom));

    const dpr = projNow.dpr;
    const finalScaleAtNewZoom = finalScalePerZoom * clampedZoom;
    const yScaleAtNewZoom = -finalScaleAtNewZoom;

    const offsetX = -((mid.x - projNow.centerX) * finalScaleAtNewZoom) / dpr;
    const offsetY = -((mid.y - projNow.centerY) * yScaleAtNewZoom) / dpr;

    setZoom(clampedZoom);
    setOffset({ x: offsetX, y: offsetY });
    dispatch(clearFocusRequest());
  }, [focusRequest, routes, dispatch, setZoom, setOffset, scale]);

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (routeTool.isDrawing) return;
    handleMouseDown(e);
  };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!routeTool.isDrawing) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const screenX = (e.clientX - rect.left) * dpr;
      const screenY = (e.clientY - rect.top) * dpr;

      const proj = getProjection(canvas.width, canvas.height);
      if (!proj) return;

      const clickPoint = { x: screenX, y: screenY };
      const tolerancePx = ROUTE_HIT_TOLERANCE_PX * dpr;

      let hitRouteId: string | null = null;
      let closestDist = Infinity;

      for (const route of routes) {
        const pts = Array.isArray(route.points) && route.points.length >= 2
          ? route.points
          : [route.startNode, route.endNode];
        const screenPts = pts.map(proj.worldToScreen);
        for (let i = 1; i < screenPts.length; i++) {
          const dist = pointToSegmentPx(clickPoint, screenPts[i - 1], screenPts[i]);
          if (dist < tolerancePx && dist < closestDist) {
            closestDist = dist;
            hitRouteId = route.id;
          }
        }
      }

      if (hitRouteId) {
        dispatch(setSelectedRouteId(hitRouteId === selectedRouteId ? null : hitRouteId));
      } else if (selectedRouteId) {
        dispatch(clearSelectedRouteId());
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const screenX = (e.clientX - rect.left) * dpr;
    const screenY = (e.clientY - rect.top) * dpr;

    const proj = getProjection(canvas.width, canvas.height);
    if (!proj) return;

    const worldPoint = proj.screenToWorld({ x: screenX, y: screenY });
    routeTool.clickCanvas(worldPoint);
  };

  const onDoubleClick = () => {
    if (routeTool.isDrawing) routeTool.commitPendingRoute();
  };

  const onContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!routeTool.isDrawing) return;
    e.preventDefault();
    routeTool.commitPendingRoute();
  };

  const onMouseMoveCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!routeTool.isDrawing) {
      handleMouseMove(e);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const screenX = (e.clientX - rect.left) * dpr;
    const screenY = (e.clientY - rect.top) * dpr;

    const proj = getProjection(canvas.width, canvas.height);
    if (!proj) return;

    const worldPoint = proj.screenToWorld({ x: screenX, y: screenY });
    routeTool.moveCanvas(worldPoint);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (routeTool.isDrawing) {
        if (e.key === 'Escape') routeTool.cancelRoute();
        if (e.key === 'Enter') routeTool.commitPendingRoute();
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRouteId) {
        const tag = (document.activeElement as HTMLElement | null)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        dispatch(removeEvacuationRouteAction(selectedRouteId));
        dispatch(removeRouteElementAction(selectedRouteId));
        dispatch(runEmergencySimulation() as any);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [routeTool.isDrawing, routeTool, selectedRouteId, dispatch]);

  const proj = useMemo(() => {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(Math.max(MIN_CANVAS_DIM, canvasSize.width || 1024) * dpr);
    const h = Math.floor(Math.max(MIN_CANVAS_DIM, canvasSize.height || 650) * dpr);
    return getProjection(w, h);
  }, [combinedModel, scale, offset, layers.rawgeometry, canvasSize]);

  const pendingPts = routeTool.pendingPoints || [];
  const lastCommitted = pendingPts.length > 0 ? pendingPts[pendingPts.length - 1] : routeTool.startPoint;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#0a0a0a' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        onMouseMove={onMouseMoveCanvas}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        style={{
          display: 'block',
          cursor: routeTool.isDrawing ? 'crosshair' : isPanning ? 'grabbing' : 'grab',
        }}
      />

      {proj && (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 10,
            width: '100%',
            height: '100%',
          }}
        >
          {/* ── Analysis layers (bottom of the stack) ──────────────── */}
          <ComplianceOverlay worldToScreen={proj.worldToScreen} />
          <CoverageZoneLayer worldToScreen={proj.worldToScreen} />
          <VisibilityConeLayer worldToScreen={proj.worldToScreen} />
          <PathFindingLayer worldToScreen={proj.worldToScreen} />

          {/* ── Heatmap (data visualization) ──────────────────────── */}
          <HeatmapLayer worldToScreen={proj.worldToScreen} />

          {/* ── Fixture glyphs ────────────────────────────────────── */}
          <EmergencyFixtureLayer worldToScreen={proj.worldToScreen} />
          <ExitSignLayer worldToScreen={proj.worldToScreen} />

          {/* ── Evacuation routes (topmost UI overlay) ────────────── */}
          <EvacuationRouteLayer worldToScreen={proj.worldToScreen} />

          {/* ── Selected fixture marker ───────────────────────────── */}
          {selectedFixture && (() => {
            const screenPt = proj.worldToScreen({ x: selectedFixture.x, y: selectedFixture.y });
            return (
              <g>
                <circle
                  cx={screenPt.x}
                  cy={screenPt.y}
                  r={20}
                  fill="rgba(56,189,248,0.15)"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
                <circle
                  cx={screenPt.x}
                  cy={screenPt.y}
                  r={6}
                  fill="#38BDF8"
                  stroke="#0F1424"
                  strokeWidth={2}
                />
              </g>
            );
          })()}

          {/* ── Route drawing preview ─────────────────────────────── */}
          {routeTool.isDrawing && pendingPts.length > 0 && routeTool.cursorPoint && (
            <g style={{ pointerEvents: 'none' }}>
              {pendingPts.length >= 2 && (
                <polyline
                  points={pendingPts
                    .map((p: { x: number; y: number }) => {
                      const s = proj.worldToScreen(p);
                      return `${s.x},${s.y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth={3}
                />
              )}
              {lastCommitted && (
                <line
                  x1={proj.worldToScreen(lastCommitted).x}
                  y1={proj.worldToScreen(lastCommitted).y}
                  x2={proj.worldToScreen(routeTool.cursorPoint).x}
                  y2={proj.worldToScreen(routeTool.cursorPoint).y}
                  stroke="#38BDF8"
                  strokeWidth={3}
                  strokeDasharray="6 4"
                />
              )}
              <circle
                cx={proj.worldToScreen(pendingPts[0]).x}
                cy={proj.worldToScreen(pendingPts[0]).y}
                r={5}
                fill="#38BDF8"
              />
            </g>
          )}

          {/* ── Legend (topmost) ──────────────────────────────────── */}
          <HeatmapLegend offsetX={16} offsetY={16} />
        </svg>
      )}

      {routeTool.isDrawing && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 12px',
            background: 'rgba(15,20,36,0.9)',
            border: '1px solid #38BDF8',
            borderRadius: 4,
            color: '#38BDF8',
            fontFamily: 'monospace',
            fontSize: 11,
            pointerEvents: 'none',
            zIndex: 11,
          }}
        >
          {pendingPts.length === 0
            ? 'Click a start point · Esc to cancel'
            : `${pendingPts.length} point${pendingPts.length === 1 ? '' : 's'} · Enter / double-click / right-click to finish · Esc to cancel`}
        </div>
      )}
    </div>
  );
};

export default EmergencyCanvas;