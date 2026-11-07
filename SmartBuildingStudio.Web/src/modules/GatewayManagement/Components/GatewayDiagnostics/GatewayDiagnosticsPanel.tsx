// src/modules/GatewayManagement/Components/GatewayDiagnostics/GatewayDiagnosticsPanel.tsx

import React, { useEffect } from 'react';
import { useGatewayDiagnostics } from '@/modules/GatewayManagement/Hooks/useGatewayDiagnostics';
import { DiagnosticsResult } from '@/modules/GatewayManagement/Components/GatewayDiagnostics/DiagnosticsResult';
import { CommunicationHealth } from '@/modules/GatewayManagement/Components/GatewayDiagnostics/CommunicationHealth';

interface Props {
  gatewayId?: string | null;
}

export const GatewayDiagnosticsPanel: React.FC<Props> = ({ gatewayId }) => {
  const { diagnostics, isHealthy, latencyMs, isRunning, isRunning: isRunningCheck, error, get, run } =
    useGatewayDiagnostics(gatewayId);

  useEffect(() => {
    if (gatewayId) {
      void get().catch(() => { /* error slot populated */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatewayId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>
          Diagnostics
        </div>
        <button
          onClick={() => { void run().catch(() => {}); }}
          disabled={isRunningCheck}
          style={{
            padding: '6px 14px',
            background: isRunningCheck ? '#1F2937' : '#1D4ED8',
            color: isRunningCheck ? '#64748B' : '#FFF',
            border: 'none',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 'bold',
            cursor: isRunningCheck ? 'not-allowed' : 'pointer',
          }}
        >
          {isRunningCheck ? 'Running…' : 'Run Diagnostics'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: 8,
          background: '#3F1D1D',
          border: '1px solid #F87171',
          borderRadius: 4,
          color: '#F87171',
          fontSize: 11,
        }}>
          {error}
        </div>
      )}

      <CommunicationHealth
        isHealthy={isHealthy}
        latencyMs={latencyMs}
        lastCheckedAt={diagnostics?.checkedAt ?? null}
      />

      <DiagnosticsResult diagnostics={diagnostics} />
    </div>
  );
};