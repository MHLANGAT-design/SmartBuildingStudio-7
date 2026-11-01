// src/modules/EmergencyLighting/Canvas/VisibilityConeLayer.tsx
//
// Draws the field-of-view wedge for each emergency light fixture.
// NOTE: fixture x/y and rangeMm are in DXF millimetres. Every point pushed
// into the SVG <polygon> must be run through worldToScreen — mixing world
// and screen points in the same polygon was the "cones to infinity" bug.

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectEmergencyLightFixtures } from '@/modules/EmergencyLighting/store/emergencySelectors';

interface VisibilityConeLayerProps {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

interface ConeSpec {
  fovDeg: number;
  rangeMm: number;
}

const CONE_BY_CLASSIFICATION: Record<string, ConeSpec> = {
  'escape-route': { fovDeg: 90, rangeMm: 5000 },
  'open-area': { fovDeg: 120, rangeMm: 8000 },
  'high-risk-task': { fovDeg: 60, rangeMm: 3000 },
  'exit-sign': { fovDeg: 45, rangeMm: 3000 },
};

export const VisibilityConeLayer: React.FC<VisibilityConeLayerProps> = ({
  worldToScreen,
}) => {
  const fixtures = useAppSelector(selectEmergencyLightFixtures);
  const visible = useAppSelector(
    (s: any) => s.emergency.layerVisibility?.visibilityCones !== false
  );

  if (!visible) return null;
  if (!Array.isArray(fixtures) || fixtures.length === 0) return null;

  return (
    <g style={{ pointerEvents: 'none' }} className="visibility-cone-layer">
      {fixtures.map((f) => {
        const classification = (f.emergencyLight as any)?.classification;
        const spec = CONE_BY_CLASSIFICATION[classification];
        if (!spec) return null;

        const rotation = typeof f.rotation === 'number' ? f.rotation : 0;
        const halfFov = (spec.fovDeg * Math.PI) / 180 / 2;
        const range = spec.rangeMm;

        const apexS = worldToScreen({ x: f.x, y: f.y });
        const leftS = worldToScreen({
          x: f.x + range * Math.cos(rotation - halfFov),
          y: f.y + range * Math.sin(rotation - halfFov),
        });
        const rightS = worldToScreen({
          x: f.x + range * Math.cos(rotation + halfFov),
          y: f.y + range * Math.sin(rotation + halfFov),
        });

        // Arc points, all in SCREEN space. The first entry is the apex
        // (also screen space) so the polygon closes correctly at the fixture.
        const arcPts: Array<{ x: number; y: number }> = [apexS];
        const SAMPLES = 20;
        for (let i = 0; i <= SAMPLES; i++) {
          const t = i / SAMPLES;
          const a = rotation - halfFov + 2 * halfFov * t;
          const wx = f.x + range * Math.cos(a);
          const wy = f.y + range * Math.sin(a);
          const s = worldToScreen({ x: wx, y: wy });
          // Defensive: drop any non-finite sample rather than poisoning the path.
          if (Number.isFinite(s.x) && Number.isFinite(s.y)) {
            arcPts.push(s);
          }
        }

        if (arcPts.length < 3) return null;

        const polyPoints = arcPts.map((p) => `${p.x},${p.y}`).join(' ');

        return (
          <g key={f.id}>
            <polygon
              points={polyPoints}
              fill="rgba(250, 204, 21, 0.10)"
              stroke="rgba(250, 204, 21, 0.45)"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
            <line
              x1={apexS.x}
              y1={apexS.y}
              x2={leftS.x}
              y2={leftS.y}
              stroke="rgba(250, 204, 21, 0.55)"
              strokeWidth={1}
            />
            <line
              x1={apexS.x}
              y1={apexS.y}
              x2={rightS.x}
              y2={rightS.y}
              stroke="rgba(250, 204, 21, 0.55)"
              strokeWidth={1}
            />
          </g>
        );
      })}
    </g>
  );
};

export default VisibilityConeLayer;