// src/modules/EmergencyLighting/Inspector/ExitSignInspector.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  selectExitSignFixtures,
  selectRoomNameById,
} from '@/modules/EmergencyLighting/store/emergencySelectors';

export const ExitSignInspector: React.FC = () => {
  const signs = useAppSelector(selectExitSignFixtures);
  const roomNames = useAppSelector(selectRoomNameById);

  if (signs.length === 0) {
    return (
      <div style={{ padding: 12, fontFamily: 'monospace', fontSize: 11, color: '#64748B' }}>
        No exit-sign fixtures in this document.
        <div style={{ marginTop: 8, color: '#94A3B8', lineHeight: 1.5 }}>
          An exit sign is an{' '}
          <b style={{ color: '#38BDF8' }}>emergencyLight</b> fixture with{' '}
          <b style={{ color: '#38BDF8' }}>classification === 'exit-sign'</b>.
          Place one in FixturePlacementStudio.
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#E2E8F0' }}>
      <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>
        Exit signs ({signs.length})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {signs.map((f) => {
          const el = f.emergencyLight ?? {};
          const roomId = f.roomId ?? null;
          const roomName = roomId ? roomNames[roomId] ?? roomId : '—';
          const rotationDeg = ((f.rotation ?? 0) * 180) / Math.PI;

          return (
            <div
              key={f.id}
              style={{
                padding: 8,
                borderRadius: 3,
                background: 'rgba(30,41,59,0.5)',
                borderLeft: '3px solid #38BDF8',
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#E2E8F0' }}>
                {f.productId?.slice(0, 8) || f.id.slice(0, 10)}
              </div>
              <div style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>
                {f.x.toFixed(0)}, {f.y.toFixed(0)} mm · {roomName}
              </div>
              <div style={{ fontSize: 10, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ color: '#94A3B8' }}>
                  Facing: <span style={{ color: '#E2E8F0' }}>{rotationDeg.toFixed(0)}°</span>
                </span>
                {el.operationMode && (
                  <span style={{ color: '#94A3B8' }}>
                    Mode: <span style={{ color: '#E2E8F0' }}>{el.operationMode}</span>
                  </span>
                )}
                {el.autonomyMinutes != null && (
                  <span style={{ color: '#94A3B8' }}>
                    Autonomy: <span style={{ color: '#E2E8F0' }}>{el.autonomyMinutes} min</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExitSignInspector;