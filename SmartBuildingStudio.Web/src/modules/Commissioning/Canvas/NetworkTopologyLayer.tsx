// src/modules/Commissioning/Canvas/NetworkTopologyLayer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  selectActiveSession,
  selectCommissioningFloorplan,
} from '@/modules/Commissioning/store/commissioningSelectors';

interface Props {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

export const NetworkTopologyLayer: React.FC<Props> = ({ worldToScreen }) => {
  const session = useAppSelector(selectActiveSession);
  const floorplan = useAppSelector(selectCommissioningFloorplan);
  const devices = Object.values(session?.deviceStates ?? {});
  if (devices.length < 2) return null;

  const fixturePos = new Map<string, { x: number; y: number }>();
  for (const f of floorplan?.fixtures ?? []) {
    fixturePos.set(f.id, { x: f.x, y: f.y });
  }

  // Collect only devices with a resolvable position on the plan.
  const points: Array<{ x: number; y: number }> = [];
  for (const dev of devices as any[]) {
    const pos =
      dev.metadata?.position ??
      fixturePos.get(dev.sourceFixtureId ?? dev.deviceId);
    if (!pos) continue;
    points.push(worldToScreen(pos));
  }
  if (points.length < 2) return null;

  const pointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <g style={{ pointerEvents: 'none' }}>
      <polyline
        points={pointsStr}
        fill="none"
        stroke="#38BDF8"
        strokeWidth={2}
        strokeOpacity={0.5}
        strokeDasharray="8 4"
      />
    </g>
  );
};