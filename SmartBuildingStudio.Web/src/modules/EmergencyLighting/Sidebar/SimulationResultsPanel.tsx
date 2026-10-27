// src/modules/EmergencyLighting/Sidebar/SimulationResultsPanel.tsx

import React from 'react';
import { useEmergencySimulation } from '@/modules/EmergencyLighting/hooks/useEmergencySimulation';

export const SimulationResultsPanel: React.FC = () => {
  const { status, issues, errorCount, warningCount, infoCount, passed, lastRunAt, error, runSimulation } =
    useEmergencySimulation();

  const isRunning = status === 'running';
  const hasRun = status === 'complete';

  return (
    <div style={{ padding: 12, fontFamily: 'monospace', fontSize: 11, color: '#E2E8F0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ color: '#94A3B8', textTransform: 'uppercase', fontSize: 10 }}>Simulation</span>
        <button
          onClick={runSimulation}
          disabled={isRunning}
          style={{
            background: isRunning ? 'rgba(56,189,248,0.1)' : 'rgba(5,255,196,0.1)',
            border: `1px solid ${isRunning ? '#38BDF8' : '#05FFC4'}`,
            color: isRunning ? '#38BDF8' : '#05FFC4',
            padding: '4px 10px',
            borderRadius: 4,
            fontFamily: 'monospace',
            fontSize: 10,
            fontWeight: 'bold',
            cursor: isRunning ? 'not-allowed' : 'pointer',
          }}
        >
          {isRunning ? '⏳ Running…' : '▶ Run Simulation'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', padding: 8, borderRadius: 4, color: '#EF4444', marginBottom: 8 }}>
          {error}
        </div>
      )}

      {hasRun && (
        <>
          <div
            style={{
              padding: 8,
              borderRadius: 4,
              marginBottom: 8,
              background: passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${passed ? '#10B981' : '#EF4444'}`,
              color: passed ? '#10B981' : '#EF4444',
              fontWeight: 'bold',
            }}
          >
            {passed ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 10, color: '#94A3B8' }}>
            <span>Errors: <b style={{ color: '#EF4444' }}>{errorCount}</b></span>
            <span>Warnings: <b style={{ color: '#F59E0B' }}>{warningCount}</b></span>
            <span>Info: <b style={{ color: '#38BDF8' }}>{infoCount}</b></span>
          </div>

          {lastRunAt && (
            <div style={{ fontSize: 9, color: '#64748B', marginBottom: 8 }}>
              Last run: {new Date(lastRunAt).toLocaleTimeString()}
            </div>
          )}

          {issues.length > 0 && (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {issues.map((issue: any) => (
                <div
                  key={issue.id}
                  style={{
                    padding: 6,
                    marginBottom: 4,
                    borderRadius: 3,
                    background: 'rgba(30,41,59,0.5)',
                    borderLeft: `3px solid ${
                      issue.severity === 'error' ? '#EF4444'
                      : issue.severity === 'warning' ? '#F59E0B'
                      : '#38BDF8'
                    }`,
                  }}
                >
                  <div style={{ fontSize: 9, color: '#64748B' }}>{issue.ruleId}</div>
                  <div style={{ fontSize: 11 }}>{issue.message}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!hasRun && !isRunning && (
        <div style={{ color: '#64748B', fontSize: 11 }}>
          Click Run Simulation to validate emergency lighting compliance.
        </div>
      )}
    </div>
  );
};