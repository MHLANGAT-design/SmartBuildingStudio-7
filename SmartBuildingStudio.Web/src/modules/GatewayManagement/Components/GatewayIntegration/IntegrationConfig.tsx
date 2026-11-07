// src/modules/GatewayManagement/Components/GatewayIntegration/IntegrationConfig.tsx

import React from 'react';
import { ProtocolSelector } from '@/modules/GatewayManagement/Components/GatewayIntegration/ProtocolSelector';
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
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, gap: 8 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{
      color: '#E5E7EB',
      fontFamily: mono ? 'monospace' : undefined,
      textAlign: 'right',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth: 220,
    }}>
      {value ?? '—'}
    </span>
  </div>
);

export const IntegrationConfig: React.FC<Props> = ({ gateway }) => {
  if (!gateway) {
    return (
      <div style={{ padding: 16, color: '#64748B', fontSize: 12, textAlign: 'center' }}>
        Select a gateway to see its integration configuration.
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: 12,
      background: '#0F1424',
      border: '1px solid #1F2937',
      borderRadius: 6,
    }}>
      <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>
        Integration Configuration
      </div>

      <ProtocolSelector
        transport={gateway.transport}
        daliProtocol={gateway.daliProtocol}
        disabled
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Row label="Endpoint" value={formatGatewayEndpoint(gateway)} mono />
        <Row label="DALI Lines" value={gateway.daliLineCount} />
        <Row label="Polling Interval" value={`${gateway.pollingIntervalSeconds}s`} />
        <Row label="Command Timeout" value={`${gateway.commandTimeoutSeconds}s`} />
      </div>
    </div>
  );
};