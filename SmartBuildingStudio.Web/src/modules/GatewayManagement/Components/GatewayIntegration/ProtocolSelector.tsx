// src/modules/GatewayManagement/Components/GatewayIntegration/ProtocolSelector.tsx

import React from 'react';
import type { TransportProtocol, DaliProtocol } from '@/modules/GatewayManagement/Models/Gateway';

interface Props {
  transport: TransportProtocol;
  daliProtocol: DaliProtocol;
  disabled?: boolean;
  onTransportChange?: (t: TransportProtocol) => void;
  onDaliProtocolChange?: (p: DaliProtocol) => void;
}

const TRANSPORTS: TransportProtocol[] = ['Http', 'Tcp', 'WebSocket'];
const DALI_PROTOCOLS: DaliProtocol[] = ['Dali2', 'Dali1Legacy', 'DaliWireless'];

export const ProtocolSelector: React.FC<Props> = ({
  transport,
  daliProtocol,
  disabled,
  onTransportChange,
  onDaliProtocolChange,
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>
        Transport Protocol
      </label>
      <select
        value={transport}
        disabled={disabled || !onTransportChange}
        onChange={e => onTransportChange?.(e.target.value as TransportProtocol)}
        style={{
          padding: '6px 8px',
          background: '#1E293B',
          color: '#E5E7EB',
          border: '1px solid #1F2937',
          borderRadius: 4,
          fontSize: 12,
          cursor: disabled || !onTransportChange ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {TRANSPORTS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>
        DALI Protocol
      </label>
      <select
        value={daliProtocol}
        disabled={disabled || !onDaliProtocolChange}
        onChange={e => onDaliProtocolChange?.(e.target.value as DaliProtocol)}
        style={{
          padding: '6px 8px',
          background: '#1E293B',
          color: '#E5E7EB',
          border: '1px solid #1F2937',
          borderRadius: 4,
          fontSize: 12,
          cursor: disabled || !onDaliProtocolChange ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {DALI_PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>
  </div>
);