// src/modules/GatewayManagement/Components/GatewayConnections/GatewayConnectionActions.tsx

import React from 'react';
import { useGatewayConnection } from '@/modules/GatewayManagement/Hooks/useGatewayConnection';

interface Props {
  gatewayId?: string | null;
}

export const GatewayConnectionActions: React.FC<Props> = ({ gatewayId }) => {
  const {
    canConnect,
    canDisconnect,
    canReconnect,
    isConnecting,
    isDisconnecting,
    isReconnecting,
    connect,
    disconnect,
    reconnect,
    connectError,
    disconnectError,
    reconnectError,
  } = useGatewayConnection(gatewayId);

  const button = (
    label: string,
    onClick: () => void,
    disabled: boolean,
    loading: boolean,
    color: string
  ) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '6px 12px',
        background: disabled || loading ? '#1F2937' : color,
        color: disabled || loading ? '#64748B' : '#FFF',
        border: 'none',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? '…' : label}
    </button>
  );

  const error = connectError ?? disconnectError ?? reconnectError;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {button(
          'Connect',
          () => { void connect().catch(() => {}); },
          !canConnect,
          isConnecting,
          '#1D4ED8'
        )}
        {button(
          'Disconnect',
          () => { void disconnect().catch(() => {}); },
          !canDisconnect,
          isDisconnecting,
          '#991B1B'
        )}
        {button(
          'Reconnect',
          () => { void reconnect().catch(() => {}); },
          !canReconnect,
          isReconnecting,
          '#B45309'
        )}
      </div>
      {error && (
        <div style={{ fontSize: 11, color: '#F87171' }}>{error}</div>
      )}
    </div>
  );
};