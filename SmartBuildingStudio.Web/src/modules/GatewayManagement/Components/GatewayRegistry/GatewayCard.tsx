// src/modules/GatewayManagement/Components/GatewayRegistry/GatewayCard.tsx

import React from 'react';
import type { Gateway } from '@/modules/GatewayManagement/Models/Gateway';
import { formatGatewayEndpoint } from '@/modules/GatewayManagement/Models/Gateway';

interface Props {
  gateway: Gateway;
  selected: boolean;
  onSelect: (gatewayId: string) => void;
}

const STATUS_COLOR: Record<Gateway['connectionStatus'], string> = {
  Disconnected: '#64748B',
  Connecting: '#FBBF24',
  Connected: '#4ADE80',
  Reconnecting: '#FBBF24',
  Error: '#F87171',
};

export const GatewayCard: React.FC<Props> = ({ gateway, selected, onSelect }) => {
  const color = STATUS_COLOR[gateway.connectionStatus];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(gateway.id)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(gateway.id);
        }
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        borderRadius: 6,
        border: '1px solid',
        borderColor: selected ? '#38BDF8' : '#1F2937',
        background: selected ? '#0EA5E915' : '#0F1424',
        cursor: 'pointer',
        outline: 'none',
        transition: 'border-color 120ms ease, background 120ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 'bold',
            color: selected ? '#38BDF8' : '#E5E7EB',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {gateway.name || '(unnamed)'}
          </div>
          <div style={{
            fontSize: 10,
            color: '#64748B',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {gateway.identifier || gateway.id}
          </div>
        </div>
        <span style={{
          padding: '2px 8px',
          borderRadius: 10,
          background: `${color}22`,
          border: `1px solid ${color}66`,
          color,
          fontSize: 10,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}>
          {gateway.connectionStatus}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B', fontFamily: 'monospace' }}>
        <span>{formatGatewayEndpoint(gateway)}</span>
        <span>{gateway.transport} · {gateway.daliProtocol}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B' }}>
        <span>{gateway.daliLineCount} DALI line{gateway.daliLineCount === 1 ? '' : 's'}</span>
        {gateway.lastSeenAt && (
          <span>last seen {new Date(gateway.lastSeenAt).toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  );
};