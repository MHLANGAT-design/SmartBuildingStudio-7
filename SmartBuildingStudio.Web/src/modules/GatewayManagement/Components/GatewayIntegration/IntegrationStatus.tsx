// src/modules/GatewayManagement/Components/GatewayIntegration/IntegrationStatus.tsx

import React from 'react';

interface Props {
  useMock: boolean;
  healthCheckIntervalSeconds: number;
  maxReconnectAttempts: number;
  lastPingResult?: boolean | null;
  lastPingAt?: string | null;
}

export const IntegrationStatus: React.FC<Props> = ({
  useMock,
  healthCheckIntervalSeconds,
  maxReconnectAttempts,
  lastPingResult,
  lastPingAt,
}) => {
  const row = (label: string, value: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
      <span style={{ color: '#64748B' }}>{label}</span>
      <span style={{ color: '#E5E7EB', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 12,
      background: '#0F1424',
      border: '1px solid #1F2937',
      borderRadius: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>
          Integration Status
        </div>
        <span style={{
          padding: '2px 8px',
          borderRadius: 10,
          background: useMock ? '#FBBF2422' : '#4ADE8022',
          border: `1px solid ${useMock ? '#FBBF2466' : '#4ADE8066'}`,
          color: useMock ? '#FBBF24' : '#4ADE80',
          fontSize: 10,
          fontWeight: 'bold',
        }}>
          {useMock ? 'MOCK MODE' : 'LIVE'}
        </span>
      </div>

      {row('Health Check Interval', `${healthCheckIntervalSeconds}s`)}
      {row('Max Reconnect Attempts', maxReconnectAttempts)}

      {lastPingResult !== undefined && lastPingResult !== null && (
        <div style={{
          marginTop: 4,
          paddingTop: 6,
          borderTop: '1px solid #1F2937',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
        }}>
          <span style={{ color: '#64748B' }}>Last Ping</span>
          <span style={{ color: lastPingResult ? '#4ADE80' : '#F87171', fontFamily: 'monospace' }}>
            {lastPingResult ? 'OK' : 'FAIL'}
            {lastPingAt && ` · ${new Date(lastPingAt).toLocaleTimeString()}`}
          </span>
        </div>
      )}
    </div>
  );
};