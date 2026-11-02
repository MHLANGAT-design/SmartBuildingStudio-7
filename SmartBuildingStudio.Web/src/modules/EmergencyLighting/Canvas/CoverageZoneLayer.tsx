// src/modules/EmergencyLighting/Canvas/CoverageZoneLayer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectEmergencyLightFixtures } from '@/modules/EmergencyLighting/store/emergencySelectors';

interface CoverageZoneLayerProps {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

const RADIUS_MM: Record<string, number> = {
  'escape-route': 5000,
  'open-area': 8000,
  'high-risk-task': 3000,
};

const DEFAULT_RADIUS_MM = 4000;

export const CoverageZoneLayer: React.FC<CoverageZoneLayerProps> = ({
  worldToScreen,
}) => {
  const fixtures = useAppSelector(selectEmergencyLightFixtures);
  const visible = useAppSelector(
    (s: any) => s.emergency.layerVisibility?.coverageZones !== false
  );

  if (!visible) return null;
  if (!Array.isArray(fixtures) || fixtures.length === 0) return null;

  const radiusToPx = (x: number, y: number, radiusMm: number): number => {
    const a = worldToScreen({ x, y });
    const b = worldToScreen({ x: x + radiusMm, y });
    return Math.abs(b.x - a.x);
  };

  return (
    <g style={{ pointerEvents: 'none' }} className="coverage-zone-layer">
      {fixtures.map((f) => {
        const classification =
          (f.emergencyLight as any)?.classification ?? 'unknown';
        const radiusMm = RADIUS_MM[classification] ?? DEFAULT_RADIUS_MM;
        const screen = worldToScreen({ x: f.x, y: f.y });
        const rPx = radiusToPx(f.x, f.y, radiusMm);
        if (rPx < 2) return null;

        return (
          <circle
            key={f.id}
            cx={screen.x}
            cy={screen.y}
            r={rPx}
            fill="rgba(56, 189, 248, 0.06)"
            stroke="rgba(56, 189, 248, 0.35)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        );
      })}
    </g>
  );
};

export default CoverageZoneLayer;