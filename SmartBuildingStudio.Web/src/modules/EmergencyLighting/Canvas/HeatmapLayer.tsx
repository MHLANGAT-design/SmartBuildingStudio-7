// src/modules/EmergencyLighting/Canvas/HeatmapLayer.tsx
//
// Renders the EmergencyLighting illuminance heatmap as SVG <rect> cells,
// one per photometric sample. Reads state.emergency.heatmap.data, which
// is populated by runEmergencyHeatmap (see store/emergencyThunks.ts).
//
// NOTE: The color ramp imported from '@/modules/Shared/Photometry/luxRamp'
// duplicates the ramp in
// FixturePlacementStudio/Canvas/Layers/PhotometricLayer.ts. The two are
// intentionally separate so EmergencyLighting can tune its visualization
// independently of FPS. If FPS's ramp is ever changed, either mirror the
// change in luxRamp.ts or migrate both modules to the shared file in a
// single follow-up task.

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { luxToColor } from '@/modules/Shared/Photometry/luxRamp';

interface HeatmapLayerProps {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ worldToScreen }) => {
  const visible = useAppSelector((s: any) => s.emergency.layerVisibility.heatmap);
  const data = useAppSelector((s: any) => s.emergency.heatmap.data);

  if (!visible || !data || !Array.isArray(data.samples) || data.samples.length === 0) {
    return null;
  }

  // Only samples with meaningful lux — matches the FPS PhotometricLayer
  // filter (0.5 lx) so the visual density is identical between modules.
  const meaningful = data.samples.filter((s: any) => s.lux > 0.5);
  if (meaningful.length === 0) return null;

  // Compute on-screen cell size from one sample's world extent.
  const sample0 = meaningful[0];
  const center = worldToScreen({ x: sample0.x, y: sample0.y });
  const edge = worldToScreen({
    x: sample0.x + (data.resolutionMeters ?? 0.5) * 1000,
    y: sample0.y,
  });
  const cellPx = Math.abs(edge.x - center.x);
  if (cellPx < 1) return null;
  const drawSize = Math.max(2, Math.min(cellPx * 1.4, 60));

  return (
    <g style={{ pointerEvents: 'none', opacity: 0.85 }}>
      {meaningful.map((s: any, i: number) => {
        const color = luxToColor(s.lux);
        if (!color) return null;
        const p = worldToScreen({ x: s.x, y: s.y });
        return (
          <rect
            key={i}
            x={p.x - drawSize / 2}
            y={p.y - drawSize / 2}
            width={drawSize}
            height={drawSize}
            fill={color}
            shapeRendering="crispEdges"
          />
        );
      })}
    </g>
  );
};

export default HeatmapLayer;