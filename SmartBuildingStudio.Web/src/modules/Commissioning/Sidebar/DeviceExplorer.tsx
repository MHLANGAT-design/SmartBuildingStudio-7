// src/modules/Commissioning/Sidebar/DeviceExplorer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectActiveSession } from '@/modules/Commissioning/store/commissioningSelectors';

export const DeviceExplorer: React.FC = () => {
  const session = useAppSelector(selectActiveSession);
  const devices = session ? Object.values(session.deviceStates) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ color: '#38BDF8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>
        Discovered Devices ({devices.length})
      </div>
      {devices.length === 0 && <div style={{ color: '#64748B', fontSize: 11 }}>No devices discovered yet.</div>}
      
      {devices.map(dev => (
        <div key={dev.deviceId} style={{ padding: '6px 8px', background: '#0F1424', border: '1px solid #1F2937', borderRadius: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: '#E5E7EB' }}>{dev.deviceId}</span>
            <span style={{ color: dev.connectionStatus === 'ONLINE' ? '#4ADE80' : '#F87171', fontWeight: 'bold' }}>
              {dev.connectionStatus}
            </span>
          </div>
          <div style={{ color: '#64748B', fontSize: 10, marginTop: 2, fontFamily: 'monospace' }}>
            Addr: {dev.shortAddress ?? 'UNASSIGNED'}
          </div>
        </div>
      ))}
    </div>
  );
};