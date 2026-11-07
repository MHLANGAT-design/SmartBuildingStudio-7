// src/modules/GatewayManagement/Components/GatewayConnections/GatewayConnectionHistory.tsx

import React, { useEffect } from 'react';
import { useGatewayConnection } from '@/modules/GatewayManagement/Hooks/useGatewayConnection';

interface Props {
  gatewayId?: string | null;
}

export const GatewayConnectionHistory: React.FC<Props> = ({ gatewayId }) => {
  const { connections, isLoadingConnections, loadConnections } = useGatewayConnection(gatewayId);

  useEffect(() => {
    if (gatewayId) {
      void loadConnections().catch(() => { /* error slot populated */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatewayId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>
        Connection History
      </div>

      {isLoadingConnections ? (
        <div style={{ padding: 12, fontSize: 11, color: '#64748B', textAlign: 'center' }}>
          Loading…
        </div>
      ) : connections.length === 0 ? (
        <div style={{ padding: 12, fontSize: 11, color: '#64748B', textAlign: 'center' }}>
          No connection history yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
          {connections.map(c => (
            <div
              key={c.id}
              style={{
                padding: '6px 8px',
                background: c.isOpen ? '#0F142415' : 'transparent',
                border: '1px solid',
                borderColor: c.isOpen ? '#4ADE8033' : '#1F2937',
                borderRadius: 4,
                fontSize: 11,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: c.isOpen ? '#4ADE80' : '#94A3B8', fontWeight: 'bold' }}>
                  {c.isOpen ? 'OPEN' : 'CLOSED'}
                </span>
                <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: 10 }}>
                  {new Date(c.connectedAt).toLocaleString()}
                </span>
              </div>
              {c.disconnectedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>closed</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 10 }}>
                    {new Date(c.disconnectedAt).toLocaleString()}
                  </span>
                </div>
              )}
              {c.disconnectReason && (
                <div style={{ color: '#F87171', fontSize: 10 }}>{c.disconnectReason}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};