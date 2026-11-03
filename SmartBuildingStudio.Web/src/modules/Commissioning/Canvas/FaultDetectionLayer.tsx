// src/modules/Commissioning/Canvas/FaultDetectionLayer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectActiveFaults } from '@/modules/Commissioning/store/commissioningSelectors';

interface Props {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

export const FaultDetectionLayer: React.FC<Props> = ({ worldToScreen }) => {
  const faults = useAppSelector(selectActiveFaults);

  return (
    <g style={{ pointerEvents: 'none' }}>
      {faults.map((fault, i) => {
        // Mock placement for faults based on index
        const screen = worldToScreen({ x: 1500 + i * 300, y: 1500 });
        
        return (
          <g key={fault.faultId} transform={`translate(${screen.x}, ${screen.y})`}>
            <circle cx={0} cy={0} r={18} fill="rgba(248, 113, 113, 0.2)" />
            <path d="M 0,-10 L 10,8 L -10,8 Z" fill="#F87171" stroke="#0F1424" strokeWidth={1} />
            <text x={0} y={4} textAnchor="middle" fill="#0F1424" fontSize={10} fontWeight="bold">!</text>
          </g>
        );
      })}
    </g>
  );
};