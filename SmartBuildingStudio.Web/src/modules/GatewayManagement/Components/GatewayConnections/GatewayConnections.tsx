// src/modules/GatewayManagement/Components/GatewayConnections/GatewayConnections.tsx

import React, { useEffect } from 'react';
import { useGatewayConnection } from '@/modules/GatewayManagement/Hooks/useGatewayConnection';
import { GatewayConnectionStatus } from '@/modules/GatewayManagement/Components/GatewayConnections/GatewayConnectionStatus';
import { GatewayConnectionActions } from '@/modules/GatewayManagement/Components/GatewayConnections/GatewayConnectionActions';
import { GatewayConnectionHistory } from '@/modules/GatewayManagement/Components/GatewayConnections/GatewayConnectionHistory';

interface Props {
  gatewayId?: string | null;
}

export const GatewayConnections: React.FC<Props> = ({ gatewayId }) => {
  const { gateway, status, refreshStatus } = useGatewayConnection(gatewayId);

  useEffect(() => {
    if (gatewayId) {
      void refreshStatus().catch(() => { /* non-fatal */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatewayId]);

  if (!gateway) {
    return (
      <div style={{ padding: 16, color: '#64748B', fontSize: 12, textAlign: 'center' }}>
        Select a gateway to see its connection state.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
          Connection Status
        </div>
        <GatewayConnectionStatus
          status={gateway.connectionStatus}
          isReachable={status?.isReachable}
          size="md"
        />
        {status?.lastErrorMessage && (
          <div style={{
            marginTop: 8,
            padding: 8,
            background: '#3F1D1D',
            border: '1px solid #F87171',
            borderRadius: 4,
            color: '#F87171',
            fontSize: 11,
          }}>
            {status.lastErrorMessage}
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
          Actions
        </div>
        <GatewayConnectionActions gatewayId={gatewayId ?? gateway.id} />
      </div>

      <GatewayConnectionHistory gatewayId={gatewayId ?? gateway.id} />
    </div>
  );
};