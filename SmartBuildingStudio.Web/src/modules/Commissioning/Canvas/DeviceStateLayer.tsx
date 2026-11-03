// src/modules/Commissioning/Canvas/DeviceStateLayer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectActiveSession } from '@/modules/Commissioning/store/commissioningSelectors';

interface Props {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

export const DeviceStateLayer: React.FC<Props> = ({ worldToScreen }) => {
  const session = useAppSelector(selectActiveSession);
  if (!session) return null;

  // Note: In a full implementation, we would map deviceId to actual X/Y coordinates.
  // For this scaffold, we'll mock a few devices at arbitrary points to prove the layer works.
  const mockDevices = Object.values(session.deviceStates).slice(0, 10).map((dev, i) => ({
    ...dev,
    x: 1000 + i * 500,
    y: 1000 + i * 200,
  }));

  return (
    <g style={{ pointerEvents: 'none' }}>
      {mockDevices.map(dev => {
        const screen = worldToScreen({ x: dev.x, y: dev.y });
        const color = dev.connectionStatus === 'ONLINE' ? '#4ADE80' :
                      dev.connectionStatus === 'FAULTY' ? '#F87171' : '#FBBF24';

        return (
          <circle
            key={dev.deviceId}
            cx={screen.x}
            cy={screen.y}
            r={16}
            fill={`${color}15`}
            stroke={color}
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        );
      })}
    </g>
  );
};