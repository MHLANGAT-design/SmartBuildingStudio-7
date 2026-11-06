// src/modules/DeviceDiscovery/Components/GatewaySelector/GatewaySelector.tsx
import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectActiveSession } from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';

export const GatewaySelector: React.FC = () => {
  const session = useAppSelector(selectActiveSession);

  return (
    <div style={{ padding: 16, borderBottom: '1px solid #1F2937' }}>
      <div style={{ fontSize: 11, fontWeight: 'bold', color: '#38BDF8', marginBottom: 8, textTransform: 'uppercase' }}>
        Target Context
      </div>
      
      {!session ? (
        <div style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
          Waiting for session initialization...
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: '#E5E7EB', marginBottom: 4 }}>
            Gateway: <span style={{ color: '#94A3B8', fontFamily: 'monospace' }}>{session.gatewayId || 'Not Selected'}</span>
          </div>
          <div style={{ fontSize: 12, color: '#E5E7EB', marginBottom: 4 }}>
            Line: <span style={{ color: '#94A3B8', fontFamily: 'monospace' }}>{session.lineId || 'Not Selected'}</span>
          </div>
          <div style={{ fontSize: 12, color: '#E5E7EB' }}>
            Status: <span style={{ 
              color: session.status === 'DISCOVERING' ? '#FBBF24' : session.status === 'COMPLETED' ? '#4ADE80' : '#94A3B8',
              fontWeight: 'bold' 
            }}>
              {session.status}
            </span>
          </div>
        </>
      )}
    </div>
  );
};