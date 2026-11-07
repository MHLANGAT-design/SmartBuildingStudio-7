// src/modules/GatewayManagement/Components/GatewayDiagnostics/DiagnosticsResult.tsx

import React from 'react';
import type { GatewayDiagnostics } from '@/modules/GatewayManagement/Models/GatewayOperation';

interface Props {
  diagnostics: GatewayDiagnostics | null;
}

export const DiagnosticsResult: React.FC<Props> = ({ diagnostics }) => {
  if (!diagnostics) {
    return (
      <div style={{ padding: 16, fontSize: 11, color: '#64748B', textAlign: 'center' }}>
        No diagnostics result yet. Click "Run" to check.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: diagnostics.isHealthy ? '#4ADE8015' : '#F8717115',
        border: `1px solid ${diagnostics.isHealthy ? '#4ADE8066' : '#F8717166'}`,
        borderRadius: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: diagnostics.isHealthy ? '#4ADE80' : '#F87171',
          }} />
          <span style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: diagnostics.isHealthy ? '#4ADE80' : '#F87171',
          }}>
            {diagnostics.isHealthy ? 'HEALTHY' : 'UNHEALTHY'}
          </span>
        </div>
        <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>
          {diagnostics.latencyMs} ms
        </span>
      </div>

      {diagnostics.errorMessage && (
        <div style={{
          padding: 8,
          background: '#3F1D1D',
          border: '1px solid #F87171',
          borderRadius: 4,
          color: '#F87171',
          fontSize: 11,
        }}>
          {diagnostics.errorMessage}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>
          Checks ({diagnostics.checks.length})
        </div>
        {diagnostics.checks.length === 0 ? (
          <div style={{ fontSize: 11, color: '#64748B' }}>No individual checks recorded.</div>
        ) : (
          diagnostics.checks.map((check, i) => (
            <div
              key={`${check.name}-${i}`}
              style={{
                padding: '6px 10px',
                background: '#0F1424',
                border: `1px solid ${check.passed ? '#4ADE8033' : '#F8717166'}`,
                borderRadius: 4,
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: check.passed ? '#4ADE80' : '#F87171',
                }} />
                <span style={{ color: '#E5E7EB' }}>{check.name || 'Check'}</span>
              </div>
              <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: 10 }}>
                {check.latencyMs} ms
              </span>
            </div>
          ))
        )}
      </div>

      <div style={{ fontSize: 10, color: '#64748B', textAlign: 'right' }}>
        Checked at {new Date(diagnostics.checkedAt).toLocaleString()}
      </div>
    </div>
  );
};