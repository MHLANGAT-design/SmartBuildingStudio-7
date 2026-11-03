// src/modules/Commissioning/Canvas/FaultDetectionLayer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  selectActiveSession,
  selectCommissioningFloorplan,
  selectActiveFaults
} from '@/modules/Commissioning/store/commissioningSelectors';

interface Props {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

export const FaultDetectionLayer: React.FC<Props> = ({ worldToScreen }) => {
  const session = useAppSelector(selectActiveSession);
  const floorplan = useAppSelector(selectCommissioningFloorplan);
  const faults = useAppSelector(selectActiveFaults);
  
  if (faults.length === 0) return null;

  const fixturePos = new Map<string, { x: number; y: number }>();
  for (const f of floorplan?.fixtures ?? []) {
    fixturePos.set(f.id, { x: f.x, y: f.y });
  }

  return (
    <g style={{ pointerEvents: 'none' }}>
      {faults.map((fault, i) => {
        // FIX: find the position of the faulted device using its id.
        // Faults usually have deviceId or sourceFixtureId attached.
        const devId = (fault as any).deviceId ?? (fault as any).sourceFixtureId;
        const dev = devId ? (session?.deviceStates as any)?.[devId] : null;
        
        const pos =
          dev?.metadata?.position ??
          (devId ? fixturePos.get(devId) : null);

        // If we can't find the device, skip it so it doesn't float randomly.
        if (!pos) return null;

        const screen = worldToScreen(pos);
        
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