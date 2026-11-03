// src/modules/Commissioning/Canvas/SignalVerificationLayer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  selectActiveSession,
  selectCommissioningFloorplan,
} from '@/modules/Commissioning/store/commissioningSelectors';

interface Props {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

export const SignalVerificationLayer: React.FC<Props> = ({ worldToScreen }) => {
  const session = useAppSelector(selectActiveSession);
  const floorplan = useAppSelector(selectCommissioningFloorplan);
  const devices = Object.values(session?.deviceStates ?? {});
  if (devices.length === 0) return null;

  const fixturePos = new Map<string, { x: number; y: number }>();
  for (const f of floorplan?.fixtures ?? []) {
    fixturePos.set(f.id, { x: f.x, y: f.y });
  }

  return (
    <g style={{ pointerEvents: 'none' }}>
      {devices.map((dev: any, i: number) => {
        // FIX: use the actual device position instead of hardcoded coordinates.
        const pos =
          dev.metadata?.position ??
          fixturePos.get(dev.sourceFixtureId ?? dev.deviceId);
        if (!pos) return null;

        const screen = worldToScreen(pos);
        const passed = dev.isOnline ?? dev.connectionStatus === 'ONLINE';
        const color = passed ? '#4ADE80' : '#F87171';

        return (
          <g key={dev.deviceId ?? dev.id ?? i} transform={`translate(${screen.x - 8}, ${screen.y - 24})`}>
            {passed ? (
              <polyline points="0,6 4,10 12,0" fill="none" stroke={color} strokeWidth={2.5} />
            ) : (
              <g stroke={color} strokeWidth={2.5}>
                <line x1={0} y1={0} x2={10} y2={10} />
                <line x1={10} y1={0} x2={0} y2={10} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};