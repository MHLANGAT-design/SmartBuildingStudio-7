// src/modules/GatewayManagement/Components/GatewayDiagnostics/CommunicationHealth.tsx

import React from 'react';

interface Props {
  isHealthy: boolean;
  latencyMs: number;
  lastCheckedAt: string | null;
}

export const CommunicationHealth: React.FC<Props> = ({ isHealthy, latencyMs, lastCheckedAt }) => {
  const quality =
    !isHealthy ? 'down'
    : latencyMs < 100 ? 'excellent'
    : latencyMs < 300 ? 'good'
    : 'slow';

  const color =
    quality === 'down' ? '#F87171'
    : quality === 'excellent' ? '#4ADE80'
    : quality === 'good' ? '#FBBF24'
    : '#F97316';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: 12,
      background: '#0F1424',
      border: '1px solid #1F2937',
      borderRadius: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: '#64748B' }}>Communication Health</span>
        <span style={{ color, fontWeight: 'bold', textTransform: 'uppercase' }}>{quality}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B' }}>
        <span>{latencyMs} ms</span>
        {lastCheckedAt && <span>{new Date(lastCheckedAt).toLocaleTimeString()}</span>}
      </div>
    </div>
  );
};