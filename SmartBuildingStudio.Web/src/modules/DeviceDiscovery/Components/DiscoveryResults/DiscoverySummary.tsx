// src/modules/DeviceDiscovery/Components/DiscoveryResults/DiscoverySummary.tsx

import React from 'react';
import type { DiscoverySession } from '@/modules/DeviceDiscovery/Types/DeviceDiscovery.types';

interface Props {
  session: DiscoverySession;
}

export const DiscoverySummary: React.FC<Props> = ({ session }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginTop: 8 }}>
    <span>Discovered: {session.discoveredCount}</span>
    <span>Matched: {session.matchedCount}</span>
    <span>Exceptions: {session.exceptionCount}</span>
  </div>
);