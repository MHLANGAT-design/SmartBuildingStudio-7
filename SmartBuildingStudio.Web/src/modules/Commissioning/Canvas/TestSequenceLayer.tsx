// src/modules/Commissioning/Canvas/TestSequenceLayer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectIsTesting } from '@/modules/Commissioning/store/commissioningSelectors';

interface Props {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

export const TestSequenceLayer: React.FC<Props> = ({ worldToScreen }) => {
  const isTesting = useAppSelector(selectIsTesting);
  if (!isTesting) return null;

  // Mock currently tested device
  const screen = worldToScreen({ x: 1500, y: 1000 });

  return (
    <g style={{ pointerEvents: 'none' }}>
      <circle cx={screen.x} cy={screen.y} r={24} fill="rgba(56, 189, 248, 0.2)" />
      <circle cx={screen.x} cy={screen.y} r={12} fill="none" stroke="#38BDF8" strokeWidth={2}>
        <animate attributeName="r" values="12;24" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0" dur="1s" repeatCount="indefinite" />
      </circle>
    </g>
  );
};