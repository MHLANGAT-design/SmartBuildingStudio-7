// src/modules/DeviceDiscovery/Components/DiscoveryResults/DiscoveryResults.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';

import {
  selectSession,
  selectDiscoveredDevices,
  selectResult,
  selectMatches,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';

import {
  summarizeResult,
  sortExceptionsBySeverity,
  exceptionLabel,
  exceptionSeverity,
  summarizeMatches,
} from '@/modules/DeviceDiscovery/Utilities/discoveryResultUtils';

/**
 * DiscoveryResults
 *
 * Read-only summary of the current session's discovery run. Pure projection
 * of the store — no fetching, no dispatching. The workflow populates
 * `session`, `devices`, `matches`, and `result` as it runs.
 *
 * Renders nothing until the session is COMPLETED.
 */
export const DiscoveryResults: React.FC = () => {
  const session = useAppSelector(selectSession);
  const devices = useAppSelector(selectDiscoveredDevices);
  const matches = useAppSelector(selectMatches);
  const result = useAppSelector(selectResult);

  if (!session || session.status !== 'COMPLETED') return null;

  const matched = devices.filter(d => d.status === 'MATCHED');
  const unmatched = devices.filter(d => d.status === 'IDENTIFIED');
  const exceptionCount =
    result?.counts.exceptions ?? session.progress.exceptionCount ?? 0;
  const matchSummary = summarizeMatches(matches);
  const sortedExceptions = result
    ? sortExceptionsBySeverity(result.exceptions)
    : [];

  return (
    <div
      style={{
        padding: 24,
        width: '100%',
        maxWidth: 800,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* ---- Header ---- */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 24, color: '#4ADE80', fontWeight: 'bold' }}>
          Discovery Complete
        </div>
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
          {result
            ? summarizeResult(result)
            : `${devices.length} device${devices.length === 1 ? '' : 's'} processed.`}
        </div>
      </div>

      {/* ---- Stat cards ---- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatCard label="Matched" count={matched.length} color="#4ADE80" />
        <StatCard label="Unmatched" count={unmatched.length} color="#FBBF24" />
        <StatCard label="Exceptions" count={exceptionCount} color="#F87171" />
      </div>

      {/* ---- Match breakdown ---- */}
      {matches.length > 0 && (
        <div
          style={{
            background: '#0F1424',
            border: '1px solid #1F2937',
            borderRadius: 6,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: '#64748B',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Match breakdown
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              fontSize: 12,
            }}
          >
            <SmallStat label="Matched" value={matchSummary.matched} color="#4ADE80" />
            <SmallStat label="Conflicts" value={matchSummary.conflicts} color="#F87171" />
            <SmallStat label="Ambiguous" value={matchSummary.ambiguous} color="#FBBF24" />
            <SmallStat label="Unmatched" value={matchSummary.unmatched} color="#94A3B8" />
          </div>
        </div>
      )}

      {/* ---- Exceptions (inlined) ---- */}
      <div
        style={{
          background: '#0F1424',
          border: '1px solid #1F2937',
          borderRadius: 6,
        }}
      >
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid #1F2937',
            fontSize: 10,
            color: '#64748B',
            textTransform: 'uppercase',
          }}
        >
          Exceptions ({sortedExceptions.length})
        </div>
        {sortedExceptions.length === 0 ? (
          <div style={{ padding: 12, fontSize: 12, color: '#4ADE80' }}>
            No exceptions — all discovered devices matched cleanly.
          </div>
        ) : (
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {sortedExceptions.map(ex => {
              const severity = exceptionSeverity(ex.kind);
              const color = severity === 'critical' ? '#F87171' : '#FBBF24';
              return (
                <div
                  key={ex.exceptionId}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #1F2937',
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color, fontWeight: 'bold' }}>
                      {exceptionLabel(ex.kind)}
                    </span>
                    {ex.deviceId && (
                      <span
                        style={{
                          color: '#64748B',
                          fontFamily: 'monospace',
                          fontSize: 10,
                        }}
                      >
                        {ex.deviceId}
                      </span>
                    )}
                    {ex.fixtureId && (
                      <span
                        style={{
                          color: '#64748B',
                          fontFamily: 'monospace',
                          fontSize: 10,
                        }}
                      >
                        → {ex.fixtureId}
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#94A3B8', marginTop: 2 }}>
                    {ex.message}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Presentational helpers                                             */
/* ------------------------------------------------------------------ */

const StatCard: React.FC<{ label: string; count: number; color: string }> = ({
  label,
  count,
  color,
}) => (
  <div
    style={{
      background: '#0F1424',
      border: '1px solid #1F2937',
      borderRadius: 6,
      padding: 16,
      textAlign: 'center',
    }}
  >
    <div
      style={{
        fontSize: 32,
        fontWeight: 'bold',
        color,
        fontFamily: 'monospace',
      }}
    >
      {count}
    </div>
    <div
      style={{
        fontSize: 11,
        color: '#64748B',
        textTransform: 'uppercase',
        marginTop: 4,
      }}
    >
      {label}
    </div>
  </div>
);

const SmallStat: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div>
    <div style={{ color: '#64748B', fontSize: 10 }}>{label}</div>
    <div style={{ color, fontWeight: 'bold' }}>{value}</div>
  </div>
);

export default DiscoveryResults;