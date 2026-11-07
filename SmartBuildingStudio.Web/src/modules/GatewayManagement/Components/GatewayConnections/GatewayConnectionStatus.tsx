// src/modules/GatewayManagement/Components/GatewayConnections/GatewayConnectionStatus.tsx

import React from 'react';
import type { ConnectionStatus } from '@/modules/GatewayManagement/Models/Gateway';

interface Props {
  status: ConnectionStatus;
  isReachable?: boolean;
  size?: 'sm' | 'md';
}

const STATUS_COLOR: Record<ConnectionStatus, string> = {
  Disconnected: '#64748B',
  Connecting: '#FBBF24',
  Connected: '#4ADE80',
  Reconnecting: '#FBBF24',
  Error: '#F87171',
};

const STATUS_PULSE: Record<ConnectionStatus, boolean> = {
  Disconnected: false,
  Connecting: true,
  Connected: false,
  Reconnecting: true,
  Error: false,
};

export const GatewayConnectionStatus: React.FC<Props> = ({ status, isReachable, size = 'sm' }) => {
  const color = STATUS_COLOR[status];
  const pulse = STATUS_PULSE[status];
  const dotSize = size === 'md' ? 10 : 8;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <style>{`@keyframes gw-status-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: color,
          boxShadow: pulse ? `0 0 0 2px ${color}33` : undefined,
          animation: pulse ? 'gw-status-pulse 1.4s ease-in-out infinite' : undefined,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: size === 'md' ? 13 : 11, color, fontWeight: 'bold' }}>
        {status}
      </span>
      {isReachable !== undefined && (
        <span style={{ fontSize: 10, color: isReachable ? '#4ADE80' : '#F87171' }}>
          · {isReachable ? 'reachable' : 'unreachable'}
        </span>
      )}
    </div>
  );
};
