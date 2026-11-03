// src/modules/Commissioning/Canvas/CommissioningCanvas.tsx

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { CanvasRenderer } from '@/modules/FloorPlanDesigner/Components/Canvas/CanvasRenderer';
import { useCommissioningFloorplan } from '@/modules/Commissioning/hooks/useCommissioningFloorplan';
import { useCommissioningCanvasPan } from '@/modules/Commissioning/hooks/useCommissioningCanvasPan';
import { useCommissioningCanvasZoom } from '@/modules/Commissioning/hooks/useCommissioningCanvasZoom';
import { 
  selectCommissioningFloorplan, 
  selectLayerVisibility 
} from '@/modules/Commissioning/store/commissioningSelectors';
import { setInspectorSelection } from '@/modules/Commissioning/store/commissioningSlice';
import { useZoomSurface } from '@/modules/Shared/Zoom/zoomRegistry';
import type { ZoomableSurface } from '@/modules/Shared/Zoom/zoomSurface';

import { DeviceStateLayer } from '@/modules/Commissioning/Canvas/DeviceStateLayer';
import { NetworkTopologyLayer } from '@/modules/Commissioning/Canvas/NetworkTopologyLayer';
import { TestSequenceLayer } from '@/modules/Commissioning/Canvas/TestSequenceLayer';
import { SignalVerificationLayer } from '@/modules/Commissioning/Canvas/SignalVerificationLayer';
import { SceneTestLayer } from '@/modules/Commissioning/Canvas/SceneTestLayer';
import { FaultDetectionLayer } from '@/modules/Commissioning/Canvas/FaultDetectionLayer';
import { LiveFeedbackLayer } from '@/modules/Commissioning/Canvas/LiveFeedbackLayer';

interface Props {
  floorplanId?: string;
}

export const CommissioningCanvas: React.FC<Props> = ({ floorplanId }) => {
  const dispatch = useAppDispatch();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useCommissioningFloorplan(floorplanId);
  const model = useAppSelector(selectCommissioningFloorplan);
  const layers = useAppSelector(selectLayerVisibility);
  
  const pan = useCommissioningCanvasPan();
  const zoom = useCommissioningCanvasZoom();

  const zoomSurface = useMemo<ZoomableSurface>(
    () => ({
      moduleName: 'Commissioning',
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
    [zoom.scale, zoom.setZoom, pan.setOffset],
  );

  useZoomSurface(zoomSurface);

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
    if (!canvas || !model) return;

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

    CanvasRenderer.clearAndDraw(
      ctx,
      canvas.width,
      canvas.height,
      { elements: model.elements } as any,
      zoom.scale,
      { x: pan.offset.x * dpr, y: pan.offset.y * dpr },
      {
        showDimensions: false,
        layers: layers,
      },
    );
  }, [model, dimensions, zoom.scale, pan.offset.x, pan.offset.y, layers]);

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
    const fitScale = Math.min((width - 120) / dxfWidth, (height - 120) / dxfHeight);
    const finalScale = fitScale * zoom.scale;
    const yScale = -finalScale;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    return {
      x: (width / 2 + pan.offset.x * dpr + (p.x - centerX) * finalScale) / dpr,
      y: (height / 2 + pan.offset.y * dpr + (p.y - centerY) * yScale) / dpr,
    };
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a0a', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', cursor: pan.isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={pan.handleMouseDown}
        onMouseMove={pan.handleMouseMove}
        onMouseUp={pan.handleMouseUpOrLeave}
        onMouseLeave={pan.handleMouseUpOrLeave}
        onWheel={zoom.handleWheel}
        onClick={() => dispatch(setInspectorSelection(null))}
      />
      {dimensions.width > 0 && (
        <svg width={dimensions.width} height={dimensions.height}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
          
          {layers.topology && <NetworkTopologyLayer worldToScreen={worldToScreen} />}
          {layers.devices && <DeviceStateLayer worldToScreen={worldToScreen} />}
          {layers.devices && <SceneTestLayer worldToScreen={worldToScreen} />}
          {layers.faults && <FaultDetectionLayer worldToScreen={worldToScreen} />}
          {layers.signals && <SignalVerificationLayer worldToScreen={worldToScreen} />}
          {layers.devices && <TestSequenceLayer worldToScreen={worldToScreen} />}
          {layers.devices && <LiveFeedbackLayer worldToScreen={worldToScreen} />}
          
        </svg>
      )}
    </div>
  );
};