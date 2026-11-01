// src/modules/EmergencyLighting/Canvas/EmergencyCanvas/EmergencyCanvas.tsx
// PART 1 of 2 — paste Part 2 immediately after this.

import React, { useEffect, useMemo, useId, useRef, useState } from 'react';
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
  setSelectedEmergencyFixtureId,
  removeEvacuationRouteAction,
  removeRouteElementAction,
  clearFocusRequest,
} from '@/modules/EmergencyLighting/store/emergencySlice';
import { runEmergencySimulation } from '@/modules/EmergencyLighting/store/emergencyThunks';
import {
  selectEmergencyFixtureById,
  selectEmergencyLightFixtures,
} from '@/modules/EmergencyLighting/store/emergencySelectors';
import { useZoomSurface } from '@/modules/Shared/Zoom/zoomRegistry';
import type { ZoomableSurface } from '@/modules/Shared/Zoom/zoomSurface';

import { buildProjection } from './projection';
import { useCombinedModel } from './useCombinedModel';
import { useCanvasSize } from './useCanvasSize';
import { useRoomLabels } from './useRoomLabels';
import { DetailRow } from './DetailRow';
import {
  isSentinel,
  pointToSegmentPx,
  hitTestFixtureScreen,
  FIXTURE_HIT_RADIUS_PX,
  MIN_CANVAS_DIM,
  ROUTE_HIT_TOLERANCE_PX,
} from './geometry';
import type { Pt } from './geometry';

export const EmergencyCanvas: React.FC = () => {
  const dispatch = useAppDispatch();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const canvasSize = useCanvasSize(canvasRef);

  const floorplanModel = useAppSelector((s: any) => s.emergency.floorplan.model);
  const rawGeometry = useAppSelector((s: any) => s.emergency.rawGeometry.elements);
  const layers = useAppSelector((s: any) => s.emergency.layerVisibility);
  const routes = useAppSelector((s: any) => s.emergency.routes || []);
  const selectedRouteId = useAppSelector((s: any) => s.emergency.ui.selectedRouteId);
  const selectedFixtureId = useAppSelector(
    (s: any) => s.emergency.ui.selectedEmergencyFixtureId,
  );
  const focusRequest = useAppSelector((s: any) => s.emergency.ui.focusRequest);

  const fixtures = useAppSelector(selectEmergencyLightFixtures);
  const selectedFixture = useAppSelector((s) =>
    selectEmergencyFixtureById(s, selectedFixtureId),
  );

  const routeTool = useEvacuationRoutes();

  const {
    offset,
    setOffset,
    isPanning,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
  } = useEmergencyCanvasPan();
  const { scale, setZoom, handleWheel } = useEmergencyCanvasZoom();

  const [hoveringFixture, setHoveringFixture] = useState(false);

  const clipId = useId().replace(/:/g, '_');

  const zoomSurface = useMemo<ZoomableSurface>(
    () => ({
      moduleName: 'Emergency Lighting',
      getZoom: () => scale,
      setZoom: (z: number) => setZoom(z),
      zoomIn: () => setZoom(scale + 0.15),
      zoomOut: () => setZoom(scale - 0.15),
      fitToContent: () => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      },
      zoomToRect: () => {},
    }),
    [scale, setZoom, setOffset],
  );

  useZoomSurface(zoomSurface);

  const combinedModel = useCombinedModel({
    floorplanModel,
    rawGeometry,
    showRawGeometry: !!layers.rawgeometry,
  });

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssW = Math.max(MIN_CANVAS_DIM, canvasSize.width || 1024);
  const cssH = Math.max(MIN_CANVAS_DIM, canvasSize.height || 650);
  const svgW = Math.floor(cssW * dpr);
  const svgH = Math.floor(cssH * dpr);
  const svgViewBox = `0 0 ${svgW} ${svgH}`;

  const proj = useMemo(
    () =>
      buildProjection({
        combinedModel,
        canvasWidth: svgW,
        canvasHeight: svgH,
        scale,
        offset,
      }),
    [combinedModel, scale, offset, svgW, svgH],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !combinedModel) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== svgW || canvas.height !== svgH) {
      canvas.width = svgW;
      canvas.height = svgH;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    }

    if (!Array.isArray(combinedModel.elements) || combinedModel.elements.length === 0) return;

    CanvasRenderer.flipY = true;
    try {
      CanvasRenderer.clearAndDraw(
        ctx,
        canvas.width,
        canvas.height,
        combinedModel,
        scale,
        { x: offset.x * dpr, y: offset.y * dpr },
        {
          showDimensions: false,
          layers: {
            walls: true,
            doors: true,
            windows: true,
            rooms: true,
            rawgeometry: layers.rawgeometry,
            fixtures: true,
          },
        },
      );
    } catch (err) {
      console.error('[EmergencyCanvas] clearAndDraw failed', err);
    }
  }, [combinedModel, scale, offset, layers, svgW, svgH, cssW, cssH, dpr]);

  useRoomLabels({
    canvas: canvasRef.current,
    combinedModel,
    proj,
    roomsVisible: layers.rooms !== false,
  });

  useEffect(() => {
    if (!focusRequest) return;
    const { routeId, segmentIndex } = focusRequest;
    const route = routes.find((r: any) => r.id === routeId);
    if (!route) {
      dispatch(clearFocusRequest());
      return;
    }

    const pts: Pt[] =
      Array.isArray(route.points) && route.points.length >= 2
        ? route.points
        : [route.startNode, route.endNode];
    const a = pts[segmentIndex];
    const b = pts[segmentIndex + 1];
    if (!a || !b || !proj) {
      dispatch(clearFocusRequest());
      return;
    }

    const mid: Pt = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const segLen = Math.hypot(b.x - a.x, b.y - a.y) || 1;

    const shortSide = Math.min(svgW, svgH);
    const targetPx = shortSide * 0.4;
    const currentFinalScale = proj.finalScale || 1;
    const currentZoom = scale || 1;
    const finalScalePerZoom = currentFinalScale / currentZoom;
    const desiredFinalScale = targetPx / segLen;
    const desiredZoom = desiredFinalScale / finalScalePerZoom;
    const clampedZoom = Math.max(0.5, Math.min(8, desiredZoom));

    const finalScaleAtNewZoom = finalScalePerZoom * clampedZoom;
    const yScaleAtNewZoom = -finalScaleAtNewZoom;

    const offsetX = -((mid.x - proj.centerX) * finalScaleAtNewZoom) / dpr;
    const offsetY = -((mid.y - proj.centerY) * yScaleAtNewZoom) / dpr;

    setZoom(clampedZoom);
    setOffset({ x: offsetX, y: offsetY });
    dispatch(clearFocusRequest());
  }, [focusRequest, routes, dispatch, setZoom, setOffset, scale, proj, svgW, svgH, dpr]);

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (routeTool.isDrawing) return;
    handleMouseDown(e);
  };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !proj) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = (e.clientX - rect.left) * dpr;
    const screenY = (e.clientY - rect.top) * dpr;

    if (!routeTool.isDrawing) {
      const clickPoint: Pt = { x: screenX, y: screenY };

      // 1. Route hit test.
      const tolerancePx = ROUTE_HIT_TOLERANCE_PX * dpr;
      let hitRouteId: string | null = null;
      let closestRouteDist = Infinity;

      for (const route of routes) {
        const pts: Pt[] =
          Array.isArray(route.points) && route.points.length >= 2
            ? route.points
            : [route.startNode, route.endNode];
        const screenPts = pts.map(proj.worldToScreenRaw);
        for (let i = 1; i < screenPts.length; i++) {
          const dist = pointToSegmentPx(clickPoint, screenPts[i - 1], screenPts[i]);
          if (dist < tolerancePx && dist < closestRouteDist) {
            closestRouteDist = dist;
            hitRouteId = route.id;
          }
        }
      }

      if (hitRouteId) {
        dispatch(setSelectedRouteId(hitRouteId === selectedRouteId ? null : hitRouteId));
        if (selectedFixtureId) dispatch(setSelectedEmergencyFixtureId(null));
        return;
      }

      // 2. Fixture hit test.
      const hitFixture = hitTestFixtureScreen(
        fixtures,
        clickPoint,
        proj.worldToScreenRaw,
        FIXTURE_HIT_RADIUS_PX * dpr,
      );

      if (hitFixture) {
        dispatch(
          setSelectedEmergencyFixtureId(
            hitFixture.id === selectedFixtureId ? null : hitFixture.id,
          ),
        );
        if (selectedRouteId) dispatch(clearSelectedRouteId());
        return;
      }

      // 3. Empty-space click — clear both.
      if (selectedRouteId) dispatch(clearSelectedRouteId());
      if (selectedFixtureId) dispatch(setSelectedEmergencyFixtureId(null));
      return;
    }

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
      const canvas = canvasRef.current;
      if (canvas && proj) {
        const rect = canvas.getBoundingClientRect();
        const screenX = (e.clientX - rect.left) * dpr;
        const screenY = (e.clientY - rect.top) * dpr;
        const hit = hitTestFixtureScreen(
          fixtures,
          { x: screenX, y: screenY },
          proj.worldToScreenRaw,
          FIXTURE_HIT_RADIUS_PX * dpr,
        );
        setHoveringFixture(!!hit);
      }
      handleMouseMove(e);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas || !proj) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = (e.clientX - rect.left) * dpr;
    const screenY = (e.clientY - rect.top) * dpr;

    const worldPoint = proj.screenToWorld({ x: screenX, y: screenY });
    routeTool.moveCanvas(worldPoint);
  };  useEffect(() => {
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

  const fixtureDetail = useMemo(() => {
    if (!selectedFixture) return null;
    const el: any = (selectedFixture as any).emergencyLight;
    if (!el) return null;

    const overrides = el.overrides || {};
    const raw = overrides.rawSpecifications || {};
    const profile = raw.device_profile || {};
    const telemetry = raw.smart_monitoring_data?.telemetry || {};

    return {
      classification: el.classification ?? '—',
      operationMode: el.operationMode ?? '—',
      autonomyMinutes: el.autonomyMinutes ?? null,
      onEscapeRoute: el.onEscapeRoute === true,
      productName: profile.product_name,
      orderCode: profile.order_code ?? overrides.orderCode,
      manufacturer: raw.brand,
      certifications: Array.isArray(overrides.certifications) ? overrides.certifications : [],
      batteryChargePct: telemetry.battery_charge_level_percentage,
      lastTestStatus: telemetry.last_function_test_status,
      hardwareFault: telemetry.hardware_fault_detected === true,
      daliAddress: raw.smart_monitoring_data?.dali_short_address,
    };
  }, [selectedFixture]);

  const pendingPts = routeTool.pendingPoints || [];
  const lastCommitted =
    pendingPts.length > 0 ? pendingPts[pendingPts.length - 1] : routeTool.startPoint;

  const safeW2S = proj?.worldToScreen ?? null;

  const cursor = routeTool.isDrawing
    ? 'crosshair'
    : isPanning
      ? 'grabbing'
      : hoveringFixture
        ? 'pointer'
        : 'grab';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#0a0a0a',
      }}
    >
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
        style={{ display: 'block', cursor }}
      />

      {proj && safeW2S && (
        <svg
          width={cssW}
          height={cssH}
          viewBox={svgViewBox}
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${cssW}px`,
            height: `${cssH}px`,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={0} y={0} width={svgW} height={svgH} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`} style={{ overflow: 'hidden' }}>
            <ComplianceOverlay worldToScreen={safeW2S} />
            <CoverageZoneLayer worldToScreen={safeW2S} />
            <VisibilityConeLayer worldToScreen={safeW2S} />
            <PathFindingLayer worldToScreen={safeW2S} />

            <HeatmapLayer worldToScreen={safeW2S} />

            <EmergencyFixtureLayer worldToScreen={safeW2S} />
            <ExitSignLayer worldToScreen={safeW2S} />

            <EvacuationRouteLayer worldToScreen={safeW2S} />

            {selectedFixture &&
              (() => {
                const screenPt = safeW2S({ x: selectedFixture.x, y: selectedFixture.y });
                if (isSentinel(screenPt)) return null;
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

            {routeTool.isDrawing && pendingPts.length > 0 && routeTool.cursorPoint && (
              <g style={{ pointerEvents: 'none' }}>
                {pendingPts.length >= 2 && (
                  <polyline
                    points={pendingPts
                      .map((p: Pt) => {
                        const s = safeW2S(p);
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
                    x1={safeW2S(lastCommitted).x}
                    y1={safeW2S(lastCommitted).y}
                    x2={safeW2S(routeTool.cursorPoint).x}
                    y2={safeW2S(routeTool.cursorPoint).y}
                    stroke="#38BDF8"
                    strokeWidth={3}
                    strokeDasharray="6 4"
                  />
                )}
                <circle
                  cx={safeW2S(pendingPts[0]).x}
                  cy={safeW2S(pendingPts[0]).y}
                  r={5}
                  fill="#38BDF8"
                />
              </g>
            )}

            <HeatmapLegend offsetX={16} offsetY={16} />
          </g>
        </svg>
      )}

      {fixtureDetail && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            minWidth: 240,
            maxWidth: 300,
            padding: '10px 12px',
            background: 'rgba(15, 20, 36, 0.94)',
            border: '1px solid #38BDF8',
            borderRadius: 6,
            color: '#E5E7EB',
            fontFamily: 'monospace',
            fontSize: 11,
            lineHeight: 1.5,
            pointerEvents: 'none',
            zIndex: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              color: '#38BDF8',
              fontWeight: 'bold',
              marginBottom: 6,
              fontSize: 11,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            Emergency Fixture
          </div>

          {fixtureDetail.productName && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ color: '#F3F4F6', fontWeight: 'bold' }}>
                {fixtureDetail.productName}
              </div>
              {fixtureDetail.manufacturer && (
                <div style={{ color: '#94A3B8', fontSize: 10 }}>
                  {fixtureDetail.manufacturer}
                </div>
              )}
            </div>
          )}

          <DetailRow label="Mode" value={fixtureDetail.operationMode} />
          <DetailRow label="Class" value={fixtureDetail.classification} />
          <DetailRow
            label="Autonomy"
            value={
              fixtureDetail.autonomyMinutes == null
                ? '—'
                : fixtureDetail.autonomyMinutes >= 60
                  ? `${(fixtureDetail.autonomyMinutes / 60).toFixed(0)} h`
                  : `${fixtureDetail.autonomyMinutes} min`
            }
          />
          <DetailRow
            label="Escape route"
            value={fixtureDetail.onEscapeRoute ? 'Yes' : 'No'}
            valueColor={fixtureDetail.onEscapeRoute ? '#4ADE80' : '#94A3B8'}
          />
          {fixtureDetail.orderCode && (
            <DetailRow label="Order code" value={fixtureDetail.orderCode} />
          )}
          {fixtureDetail.daliAddress != null && (
            <DetailRow label="DALI addr" value={String(fixtureDetail.daliAddress)} />
          )}
          {fixtureDetail.batteryChargePct != null && (
            <DetailRow
              label="Battery"
              value={`${fixtureDetail.batteryChargePct}%`}
              valueColor={
                fixtureDetail.batteryChargePct >= 80
                  ? '#4ADE80'
                  : fixtureDetail.batteryChargePct >= 40
                    ? '#FBBF24'
                    : '#F87171'
              }
            />
          )}
          {fixtureDetail.lastTestStatus && (
            <DetailRow
              label="Last test"
              value={fixtureDetail.lastTestStatus}
              valueColor={
                fixtureDetail.lastTestStatus === 'Passed' ? '#4ADE80' : '#F87171'
              }
            />
          )}
          {fixtureDetail.hardwareFault && (
            <div
              style={{
                marginTop: 6,
                padding: '3px 6px',
                background: 'rgba(248, 113, 113, 0.15)',
                border: '1px solid #F87171',
                borderRadius: 3,
                color: '#F87171',
                fontSize: 10,
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              ⚠ HARDWARE FAULT
            </div>
          )}
          {fixtureDetail.certifications.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {fixtureDetail.certifications.map((c: string) => (
                <span
                  key={c}
                  style={{
                    padding: '1px 5px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: 2,
                    color: '#7DD3FC',
                    fontSize: 9,
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
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