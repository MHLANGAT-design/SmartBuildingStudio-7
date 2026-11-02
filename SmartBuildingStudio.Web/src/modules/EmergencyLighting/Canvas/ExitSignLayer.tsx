// src/modules/EmergencyLighting/Canvas/ExitSignLayer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectExitSignFixtures } from '@/modules/EmergencyLighting/store/emergencySelectors';

interface ExitSignLayerProps {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

type ExitDirection =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'forward'
  | 'back';

const DIRECTION_ANGLE_DEG: Record<ExitDirection, number> = {
  right: 0,
  forward: 0,
  left: 180,
  back: 180,
  up: -90,
  down: 90,
};

function normalizeDirection(raw: unknown): ExitDirection {
  const s = String(raw ?? '').toLowerCase();
  if (s === 'left' || s === 'right' || s === 'up' || s === 'down' || s === 'forward' || s === 'back') {
    return s as ExitDirection;
  }
  return 'right';
}

export const ExitSignLayer: React.FC<ExitSignLayerProps> = ({ worldToScreen }) => {
  const fixtures = useAppSelector(selectExitSignFixtures);
  const selectedId = useAppSelector(
    (s: any) => s.emergency.ui.selectedEmergencyFixtureId
  );
  const visible = useAppSelector(
    (s: any) => s.emergency.layerVisibility?.exitSigns !== false
  );

  if (!visible) return null;
  if (!Array.isArray(fixtures) || fixtures.length === 0) return null;

  const SIGN_W = 34;
  const SIGN_H = 16;

  return (
    <g style={{ pointerEvents: 'none' }} className="exit-sign-layer">
      {fixtures.map((f) => {
        const direction = normalizeDirection(
          (f.properties as any)?.exitDirection
        );
        const angle = DIRECTION_ANGLE_DEG[direction];
        const screen = worldToScreen({ x: f.x, y: f.y });
        const isSelected = f.id === selectedId;

        const stroke = isSelected ? '#38BDF8' : '#10B981';
        const strokeWidth = isSelected ? 2.5 : 1.5;

        return (
          <g
            key={f.id}
            transform={`translate(${screen.x}, ${screen.y}) rotate(${angle})`}
          >
            {isSelected && (
              <rect
                x={-SIGN_W / 2 - 4}
                y={-SIGN_H / 2 - 4}
                width={SIGN_W + 8}
                height={SIGN_H + 8}
                rx={5}
                fill="none"
                stroke="#38BDF8"
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            )}
            <rect
              x={-SIGN_W / 2}
              y={-SIGN_H / 2}
              width={SIGN_W}
              height={SIGN_H}
              rx={3}
              fill="#10B981"
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <text
              x={-4}
              y={0}
              fill="#0B0F19"
              fontSize={9}
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              EXIT
            </text>
            <path
              d={`M ${SIGN_W / 2 - 4} 0 L ${SIGN_W / 2 - 10} -4 L ${SIGN_W / 2 - 10} 4 Z`}
              fill="#0B0F19"
            />
          </g>
        );
      })}
    </g>
  );
};

export default ExitSignLayer;