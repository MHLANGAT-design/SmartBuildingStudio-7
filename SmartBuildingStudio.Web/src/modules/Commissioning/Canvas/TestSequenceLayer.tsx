// src/modules/Commissioning/Canvas/TestSequenceLayer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  selectIsTesting,
  selectActiveSession,
  selectCommissioningFloorplan
} from '@/modules/Commissioning/store/commissioningSelectors';

interface Props {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

export const TestSequenceLayer: React.FC<Props> = ({ worldToScreen }) => {
  const isTesting = useAppSelector(selectIsTesting);
  const session = useAppSelector(selectActiveSession);
  const floorplan = useAppSelector(selectCommissioningFloorplan);
  
  if (!isTesting) return null;

  const fixturePos = new Map<string, { x: number; y: number }>();
  for (const f of floorplan?.fixtures ?? []) {
    fixturePos.set(f.id, { x: f.x, y: f.y });
  }

  // Show the pulse on the first device that has a known position
  const devices = Object.values(session?.deviceStates ?? {});
  let targetScreen = null;

  for (let i = 0; i < devices.length; i++) {
    const dev = devices[i] as any;
    const pos = dev.metadata?.position ?? fixturePos.get(dev.sourceFixtureId ?? dev.deviceId);
    if (pos) {
      targetScreen = worldToScreen(pos);
      break;
    }
  }

  if (!targetScreen) return null;

  return (
    <g style={{ pointerEvents: 'none' }}>
      <circle cx={targetScreen.x} cy={targetScreen.y} r={24} fill="rgba(56, 189, 248, 0.2)" />
      <circle cx={targetScreen.x} cy={targetScreen.y} r={12} fill="none" stroke="#38BDF8" strokeWidth={2}>
        <animate attributeName="r" values="12;24" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0" dur="1s" repeatCount="indefinite" />
      </circle>
    </g>
  );
};