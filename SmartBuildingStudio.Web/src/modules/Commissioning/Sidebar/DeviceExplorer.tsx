// src/modules/Commissioning/Sidebar/DeviceExplorer.tsx

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectActiveSession,
  selectSelectedDeviceId 
} from '@/modules/Commissioning/store/commissioningSelectors';
import { setInspectorSelection } from '@/modules/Commissioning/store/commissioningSlice';

export const DeviceExplorer: React.FC = () => {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectActiveSession);
  const selectedId = useAppSelector(selectSelectedDeviceId);
  const [isOpen, setIsOpen] = useState(true);

  const devices = Object.values(session?.deviceStates ?? {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          color: '#38BDF8', fontSize: 11, fontWeight: 'bold', 
          textTransform: 'uppercase', marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 6,
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 10, width: 12, display: 'inline-block' }}>
          {isOpen ? '▼' : '▶'}
        </span>
        Discovered Devices ({devices.length})
      </div>
      
      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 18 }}>
          {devices.length === 0 && (
            <div style={{ color: '#64748B', fontSize: 11 }}>No devices discovered yet.</div>
          )}

          {devices.map(dev => {
            const isSelected = dev.deviceId === selectedId;
            return (
              <div 
                key={dev.deviceId} 
                onClick={() => dispatch(setInspectorSelection({ kind: 'device', id: dev.deviceId }))} // <-- UPDATED
                style={{ 
                  padding: '6px 8px', 
                  background: isSelected ? '#1D4ED8' : '#0F1424', 
                  border: isSelected ? '1px solid #38BDF8' : '1px solid #1F2937', 
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: isSelected ? '#FFF' : '#E5E7EB' }}>
                    {dev.deviceId}
                  </span>
                  <span style={{ 
                    color: dev.connectionStatus === 'ONLINE' ? '#4ADE80' : '#F87171', 
                    fontWeight: 'bold' 
                  }}>
                    {dev.connectionStatus}
                  </span>
                </div>
                <div style={{ 
                  color: isSelected ? '#BAE6FD' : '#64748B', 
                  fontSize: 10, marginTop: 2, fontFamily: 'monospace' 
                }}>
                  Addr: {dev.shortAddress ?? 'UNASSIGNED'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};