// src/modules/GatewayManagement/Components/GatewayRegistry/GatewayDetails.tsx

import React from 'react';
import type { Gateway } from '@/modules/GatewayManagement/Models/Gateway';
import { formatGatewayEndpoint } from '@/modules/GatewayManagement/Models/Gateway';

interface Props {
  gateway: Gateway | null;
}

const Row: React.FC<{ label: string; value: string | number | null; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span
      style={{
        color: '#E5E7EB',
        fontFamily: mono ? 'monospace' : undefined,
        textAlign: 'right',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: 220,
      }}
      title={value != null ? String(value) : undefined}
    >
      {value ?? '—'}
    </span>
  </div>
);

export const GatewayDetails: React.FC<Props> = ({ gateway }) => {
  if (!gateway) {
    return (
      <div style={{ padding: 16, color: '#64748B', fontSize: 12, textAlign: 'center' }}>
        Select a gateway to see its details.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#38BDF8' }}>{gateway.name}</div>
        <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'monospace', marginTop: 2 }}>
          {gateway.id}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Row label="Identifier" value={gateway.identifier} mono />
        <Row label="Transport" value={gateway.transport} />
        <Row label="DALI Protocol" value={gateway.daliProtocol} />
        <Row label="Endpoint" value={formatGatewayEndpoint(gateway)} mono />
        <Row label="Connection" value={gateway.connectionStatus} />
        <Row label="DALI Lines" value={gateway.daliLineCount} />
        <Row label="Polling" value={`${gateway.pollingIntervalSeconds}s`} />
        <Row label="Command Timeout" value={`${gateway.commandTimeoutSeconds}s`} />
        <Row
          label="Last Connected"
          value={gateway.lastConnectedAt ? new Date(gateway.lastConnectedAt).toLocaleString() : null}
        />
        <Row
          label="Last Seen"
          value={gateway.lastSeenAt ? new Date(gateway.lastSeenAt).toLocaleString() : null}
        />
        {gateway.lastErrorMessage && (
          <div style={{
            marginTop: 6,
            padding: 8,
            background: '#3F1D1D',
            border: '1px solid #F87171',
            borderRadius: 4,
            color: '#F87171',
            fontSize: 11,
          }}>
            {gateway.lastErrorMessage}
          </div>
        )}
      </div>
    </div>
  );
};