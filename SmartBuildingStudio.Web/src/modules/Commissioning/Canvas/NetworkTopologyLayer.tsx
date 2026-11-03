// src/modules/Commissioning/Canvas/NetworkTopologyLayer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectActiveSession } from '@/modules/Commissioning/store/commissioningSelectors';

interface Props {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

export const NetworkTopologyLayer: React.FC<Props> = ({ worldToScreen }) => {
  const session = useAppSelector(selectActiveSession);
  if (!session) return null;

  // Mock topology path
  const path = [
    worldToScreen({ x: 1000, y: 1000 }),
    worldToScreen({ x: 1500, y: 1000 }),
    worldToScreen({ x: 2000, y: 1200 }),
    worldToScreen({ x: 2500, y: 1200 }),
  ];

  const pointsStr = path.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <g style={{ pointerEvents: 'none' }}>
      <polyline
        points={pointsStr}
        fill="none"
        stroke="#38BDF8"
        strokeWidth={2}
        strokeOpacity={0.4}
        strokeDasharray="8 4"
      />
    </g>
  );
};