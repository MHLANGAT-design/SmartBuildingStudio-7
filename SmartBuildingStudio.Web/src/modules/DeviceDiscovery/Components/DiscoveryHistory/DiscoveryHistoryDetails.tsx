// src/modules/DeviceDiscovery/Components/DiscoveryHistory/DiscoveryHistoryDetails.tsx

import React from 'react';
import type { DiscoverySession } from '@/modules/DeviceDiscovery/Types/DeviceDiscovery.types';

interface Props {
  session: DiscoverySession;
}

export const DiscoveryHistoryDetails: React.FC<Props> = ({ session }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Row label="Session" value={session.sessionId} mono />
      <Row label="Started" value={new Date(session.startedAt).toLocaleString()} />
      <Row
        label="Completed"
        value={session.completedAt ? new Date(session.completedAt).toLocaleString() : '—'}
      />
      <Row label="Status" value={session.status} />
      <Row label="Discovered" value={String(session.discoveredCount)} />
      <Row label="Matched" value={String(session.matchedCount)} />
      <Row label="Exceptions" value={String(session.exceptionCount)} />
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{
      color: '#E5E7EB',
      fontFamily: mono ? 'monospace' : undefined,
    }}>
      {value}
    </span>
  </div>
);