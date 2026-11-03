// src/modules/Commissioning/Canvas/CommissioningCanvas.tsx

import React, { useRef, useEffect, useState } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectDocument } from '@/modules/FloorPlanDesigner/Store/FloorPlanSelectors'; // FIXED
import { CanvasRenderer } from '@/modules/FloorPlanDesigner/Components/Canvas/CanvasRenderer';

import { DeviceStateLayer } from '@/modules/Commissioning/Canvas/DeviceStateLayer';
import { NetworkTopologyLayer } from '@/modules/Commissioning/Canvas/NetworkTopologyLayer';
import { TestSequenceLayer } from '@/modules/Commissioning/Canvas/TestSequenceLayer';
import { SignalVerificationLayer } from '@/modules/Commissioning/Canvas/SignalVerificationLayer';
import { SceneTestLayer } from '@/modules/Commissioning/Canvas/SceneTestLayer';
import { FaultDetectionLayer } from '@/modules/Commissioning/Canvas/FaultDetectionLayer';
import { LiveFeedbackLayer } from '@/modules/Commissioning/Canvas/LiveFeedbackLayer';

export const CommissioningCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const floorplan = useAppSelector(selectDocument); // FIXED
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !floorplan || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    CanvasRenderer.clearAndDraw(
      ctx,
      canvas.width,
      canvas.height,
      floorplan,
      1,
      { x: 0, y: 0 },
      { 
        showDimensions: false, 
        layers: { 
          walls: true, 
          doors: true, 
          windows: true, 
          rooms: true, 
          rawgeometry: true, 
          fixtures: true 
        } 
      }
    );
  }, [floorplan, dimensions]);

  const worldToScreen = (p: { x: number; y: number }) => ({
    x: dimensions.width / 2 + p.x,
    y: dimensions.height / 2 - p.y,
  });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a0a', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      
      {dimensions.width > 0 && (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          <NetworkTopologyLayer worldToScreen={worldToScreen} />
          <DeviceStateLayer worldToScreen={worldToScreen} />
          <SceneTestLayer worldToScreen={worldToScreen} />
          <FaultDetectionLayer worldToScreen={worldToScreen} />
          <SignalVerificationLayer worldToScreen={worldToScreen} />
          <TestSequenceLayer worldToScreen={worldToScreen} />
          <LiveFeedbackLayer worldToScreen={worldToScreen} />
        </svg>
      )}
    </div>
  );
};