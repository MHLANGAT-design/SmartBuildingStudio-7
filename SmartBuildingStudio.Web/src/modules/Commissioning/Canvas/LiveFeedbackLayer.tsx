// src/modules/Commissioning/Canvas/LiveFeedbackLayer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectIsTesting, 
  selectActiveFaults 
} from '@/modules/Commissioning/store/commissioningSelectors';

interface Props {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

export const LiveFeedbackLayer: React.FC<Props> = ({ worldToScreen }) => {
  const isTesting = useAppSelector(selectIsTesting);
  const faults = useAppSelector(selectActiveFaults);

  if (!isTesting && faults.length === 0) return null;

  const screen = worldToScreen({ x: 1000, y: 1000 });

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect 
        x={screen.x + 20} 
        y={screen.y - 40} 
        width={200} 
        height={30} 
        fill="rgba(15, 20, 36, 0.9)" 
        stroke="#38BDF8" 
        strokeWidth={1} 
        rx={4} 
      />
      <text 
        x={screen.x + 30} 
        y={screen.y - 20} 
        fill="#38BDF8" 
        fontSize={11} 
        fontFamily="monospace"
      >
        {isTesting ? 'Sending signal...' : `${faults.length} fault(s) detected`}
      </text>
    </g>
  );
};