// src/modules/EmergencyLighting/Canvas/EmergencyCanvas.tsx

import React, { useEffect, useRef, useMemo } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { CanvasRenderer } from '@/modules/FloorPlanDesigner/Components/Canvas/CanvasRenderer';
import { useEmergencyCanvasPan } from '@/modules/EmergencyLighting/hooks/useEmergencyCanvasPan';
import { useEmergencyCanvasZoom } from '@/modules/EmergencyLighting/hooks/useEmergencyCanvasZoom';
import { useZoomSurface } from '@/modules/Shared/Zoom/zoomRegistry';
import type { ZoomableSurface } from '@/modules/Shared/Zoom/zoomSurface';

export const EmergencyCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const floorplanModel = useAppSelector((s: any) => s.emergency.floorplan.model);
  const rawGeometry = useAppSelector((s: any) => s.emergency.rawGeometry.elements);
  const layers = useAppSelector((s: any) => s.emergency.layerVisibility);

  const { offset, setOffset, isPanning, handleMouseDown, handleMouseMove, handleMouseUpOrLeave } = useEmergencyCanvasPan();
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

  const combinedModel = useMemo(() => {
    if (!floorplanModel) return null;
    const elements = [...(floorplanModel.elements || [])];
    if (layers.rawgeometry && rawGeometry.length > 0) {
      elements.push(...rawGeometry);
    }
    return { ...floorplanModel, elements };
  }, [floorplanModel, rawGeometry, layers.rawgeometry]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !combinedModel) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement?.getBoundingClientRect();
    const cssWidth = rect?.width || 1024;
    const cssHeight = rect?.height || 650;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    CanvasRenderer.clearAndDraw(
      ctx,
      canvas.width,
      canvas.height,
      combinedModel,
      scale,
      offset,
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
      }
    );
  }, [combinedModel, scale, offset, layers]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#0a0a0a' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        style={{ display: 'block', cursor: isPanning ? 'grabbing' : 'grab' }}
      />
    </div>
  );
};

export default EmergencyCanvas;