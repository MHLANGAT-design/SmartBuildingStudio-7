// src/modules/Commissioning/Canvas/DeviceStateLayer.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import {
  selectActiveSession,
  selectCommissioningFloorplan,
  selectSelectedDeviceId,
} from '@/modules/Commissioning/store/commissioningSelectors';
import { setInspectorSelection } from '@/modules/Commissioning/store/commissioningSlice';

interface Props {
  worldToScreen: (p: { x: number; y: number }) => { x: number; y: number };
}

export const DeviceStateLayer: React.FC<Props> = ({ worldToScreen }) => {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectActiveSession);
  const floorplan = useAppSelector(selectCommissioningFloorplan);
  const selectedId = useAppSelector(selectSelectedDeviceId);
  
  const devices = Object.values(session?.deviceStates ?? {});
  if (devices.length === 0) return null;

  const fixturePos = new Map<string, { x: number; y: number }>();
  for (const f of floorplan?.fixtures ?? []) {
    fixturePos.set(f.id, { x: f.x, y: f.y });
  }

  return (
    <g>
      {devices.map((dev: any, i: number) => {
        const pos = dev.metadata?.position ?? fixturePos.get(dev.sourceFixtureId ?? dev.deviceId);
        if (!pos) return null;

        const screen = worldToScreen(pos);
        const online = dev.isOnline ?? dev.connectionStatus === 'ONLINE';
        const color = online ? '#4ADE80' : dev.connectionStatus === 'FAULTY' ? '#F87171' : '#FBBF24';
        const isSelected = dev.deviceId === selectedId;

        return (
          <g key={dev.deviceId ?? dev.id ?? i}>
            {isSelected && (
              <circle
                cx={screen.x} cy={screen.y} r={20}
                fill="none" stroke="#38BDF8" strokeWidth={2}
                strokeDasharray="4 4"
              >
                <animateTransform 
                  attributeName="transform" type="rotate" 
                  from={`0 ${screen.x} ${screen.y}`} to={`360 ${screen.x} ${screen.y}`} 
                  dur="4s" repeatCount="indefinite" 
                />
              </circle>
            )}
            <circle
              cx={screen.x} cy={screen.y} r={14}
              fill={`${color}15`} stroke={isSelected ? '#38BDF8' : color} strokeWidth={2} strokeDasharray="4 4"
            />
            <circle
              cx={screen.x} cy={screen.y} r={18}
              fill="transparent"
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                dispatch(setInspectorSelection({ kind: 'device', id: dev.deviceId })); // <-- UPDATED
              }}
            />
          </g>
        );
      })}
    </g>
  );
};