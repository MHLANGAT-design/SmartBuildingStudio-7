// src/modules/DeviceDiscovery/Canvas/DeviceDiscoveryCanvas.tsx

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { CanvasRenderer } from '@/modules/FloorPlanDesigner/Components/Canvas/CanvasRenderer';
import { useDeviceDiscoveryFloorplan } from '@/modules/DeviceDiscovery/Hooks/useDeviceDiscoveryFloorplan';
import { useDeviceDiscoveryCanvasPan } from '@/modules/DeviceDiscovery/Canvas/useDeviceDiscoveryCanvasPan';
import { useDeviceDiscoveryCanvasZoom } from '@/modules/DeviceDiscovery/Canvas/useDeviceDiscoveryCanvasZoom';
import {
  selectFloorplan,
  selectFloorplanLoading,
  selectFloorplanError,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';
import { selectDevice } from '@/modules/DeviceDiscovery/Store/deviceDiscoverySlice';
import { useZoomSurface } from '@/modules/Shared/Zoom/zoomRegistry';
import type { ZoomableSurface } from '@/modules/Shared/Zoom/zoomSurface';

import { DiscoveredDeviceLayer } from '@/modules/DeviceDiscovery/Canvas/DiscoveredDeviceLayer';

interface Props {
  floorplanId?: string;
  projectId?: string;
}

const ALL_LAYERS = {
  walls: true,
  doors: true,
  windows: true,
  rooms: true,
  fixtures: true,
  rawgeometry: true,
};

export const DeviceDiscoveryCanvas: React.FC<Props> = ({ floorplanId, projectId }) => {
  const dispatch = useAppDispatch();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useDeviceDiscoveryFloorplan(floorplanId, projectId);
  const model = useAppSelector(selectFloorplan);
  const loading = useAppSelector(selectFloorplanLoading);
  const error = useAppSelector(selectFloorplanError);

  const pan = useDeviceDiscoveryCanvasPan();
  const zoom = useDeviceDiscoveryCanvasZoom();

  const zoomRef = useRef(zoom.scale);
  zoomRef.current = zoom.scale;
  const setZoomRef = useRef(zoom.setZoom);
  setZoomRef.current = zoom.setZoom;

  const zoomSurface = useMemo<ZoomableSurface>(
    () => ({
      moduleName: 'DeviceDiscovery',
      getZoom: () => zoom.scale,
      setZoom: (z: number) => zoom.setZoom(z),
      zoomIn: () => zoom.setZoom(zoom.scale + 0.15),
      zoomOut: () => zoom.setZoom(zoom.scale - 0.15),
      fitToContent: () => {
        zoom.setZoom(1);
        pan.setOffset({ x: 0, y: 0 });
      },
      zoomToRect: () => {},
    }),
    [zoom.scale, zoom.setZoom, pan.setOffset]
  );

  useZoomSurface(zoomSurface);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY < 0 ? 1 : -1;
      setZoomRef.current(zoomRef.current + 0.15 * direction);
    };
    canvas.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheelNative);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, []);

  const bounds = useMemo(() => {
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
    (model?.elements || []).forEach((el: any) => {
      const pts = el.points || el.vertices || (el.start && el.end ? [el.start, el.end] : []);
      if (Array.isArray(pts)) pts.forEach(processPoint);
      if (typeof el.x === 'number' && typeof el.y === 'number') processPoint({ x: el.x, y: el.y });
    });
    ((model as any)?.doors || []).forEach((d: any) => processPoint({ x: d.hingeX, y: d.hingeY }));
    if (!hasPoints) { minX = -1000; maxX = 1000; minY = -1000; maxY = 1000; }
    return { minX, maxX, minY, maxY };
  }, [model]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = dimensions.width;
    const cssH = dimensions.height;
    const widthPx = cssW * dpr;
    const heightPx = cssH * dpr;
    if (widthPx < 200 || heightPx < 200) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = widthPx;
    canvas.height = heightPx;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    if (!model) {
      ctx.fillStyle = '#0B0F19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    CanvasRenderer.clearAndDraw(
      ctx,
      canvas.width,
      canvas.height,
      { elements: model.elements } as any,
      zoom.scale,
      { x: pan.offset.x * dpr, y: pan.offset.y * dpr },
      { showDimensions: false, layers: ALL_LAYERS }
    );
  }, [model, dimensions, zoom.scale, pan.offset.x, pan.offset.y]);

  const worldToScreen = (p: { x: number; y: number }) => {
    if (!model || dimensions.width === 0) {
      return { x: dimensions.width / 2 + p.x, y: dimensions.height / 2 - p.y };
    }
    const dpr = window.devicePixelRatio || 1;
    const width = dimensions.width * dpr;
    const height = dimensions.height * dpr;
    const { minX, maxX, minY, maxY } = bounds;
    const dxfWidth = maxX - minX || 1;
    const dxfHeight = maxY - minY || 1;

    const fitScale = Math.min((width - 120) / dxfWidth, (height - 120) / dxfHeight) * (zoom.scale || 1);
    const yScale = -fitScale;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return {
      x: (width / 2 + pan.offset.x * dpr + (p.x - centerX) * fitScale) / dpr,
      y: (height / 2 + pan.offset.y * dpr + (p.y - centerY) * yScale) / dpr,
    };
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a0a', overflow: 'hidden' }}>
      {loading && (
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 2,
          background: '#0F1424', border: '1px solid #1F2937', borderRadius: 4,
          padding: '4px 8px', fontSize: 10, color: '#94A3B8',
        }}>
          Loading floor plan…
        </div>
      )}
      {error && !loading && (
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 2,
          background: '#3F1D1D', border: '1px solid #F87171', borderRadius: 4,
          padding: '4px 8px', fontSize: 11, color: '#F87171', maxWidth: '80%'
        }}>
          ⚠️ {error}
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{ display: 'block', cursor: pan.isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={pan.handleMouseDown}
        onMouseMove={pan.handleMouseMove}
        onMouseUp={pan.handleMouseUpOrLeave}
        onMouseLeave={pan.handleMouseUpOrLeave}
        onClick={() => dispatch(selectDevice(null))}
      />
      {dimensions.width > 0 && (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          <g style={{ pointerEvents: 'auto' }}>
            <DiscoveredDeviceLayer worldToScreen={worldToScreen} bounds={bounds} />
          </g>
        </svg>
      )}
    </div>
  );
};