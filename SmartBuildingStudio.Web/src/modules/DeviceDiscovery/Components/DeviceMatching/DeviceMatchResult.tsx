// src/modules/DeviceDiscovery/Components/DeviceMatching/DeviceMatchResult.tsx

import React from 'react';
import type { DeviceMatch } from '@/modules/DeviceDiscovery/Types/DeviceDiscovery.types';

interface Props {
  match: DeviceMatch;
}

export const DeviceMatchResult: React.FC<Props> = ({ match }) => {
  const color =
    match.matchType === 'EXACT' ? '#4ADE80'
    : match.matchType === 'FUZZY' ? '#FBBF24'
    : '#F87171';

  return (
    <div style={{
      background: '#0F1424',
      border: '1px solid #1F2937',
      borderLeft: `3px solid ${color}`,
      borderRadius: 4,
      padding: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#E5E7EB', fontFamily: 'monospace' }}>
          {match.discoveredDeviceId}
        </span>
        <span style={{ fontSize: 10, color, fontWeight: 'bold' }}>
          {match.matchType}
        </span>
      </div>
      <div style={{ fontSize: 10, color: '#64748B' }}>
        → Fixture: {match.expectedFixtureId ?? 'unassigned'}
      </div>
      <div style={{ fontSize: 10, color: '#64748B' }}>
        Confidence: {(match.confidence * 100).toFixed(0)}%
      </div>
      {match.discrepancyNotes && (
        <div style={{ fontSize: 10, color: '#FBBF24', marginTop: 4 }}>
          {match.discrepancyNotes}
        </div>
      )}
    </div>
  );
};