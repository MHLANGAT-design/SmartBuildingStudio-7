// src/modules/Commissioning/Canvas/SignalVerificationLayer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectActiveSession } from '@/modules/Commissioning/store/commissioningSelectors';

interface Props {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

export const SignalVerificationLayer: React.FC<Props> = ({ worldToScreen }) => {
  const session = useAppSelector(selectActiveSession);
  if (!session) return null;

  // Render a mock checkmark for the first 5 devices
  const devices = Object.values(session.deviceStates).slice(0, 5);

  return (
    <g style={{ pointerEvents: 'none' }}>
      {devices.map((dev, i) => {
        const screen = worldToScreen({ x: 1000 + i * 500, y: 1000 + i * 200 });
        const passed = dev.connectionStatus === 'ONLINE';
        const color = passed ? '#4ADE80' : '#F87171';

        return (
          <g key={dev.deviceId} transform={`translate(${screen.x - 8}, ${screen.y - 30})`}>
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