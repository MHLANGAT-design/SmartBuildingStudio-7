// src/modules/DeviceDiscovery/Components/DiscoveryToolbar/DiscoveryActions.tsx

import React from 'react';

interface Props {
  onStart: () => void;
  onStop: () => void;
  isDiscovering: boolean;
  isLoading: boolean;
}

export const DiscoveryActions: React.FC<Props> = ({ onStart, onStop, isDiscovering, isLoading }) => (
  <div style={{ display: 'flex', gap: 8 }}>
    <button
      onClick={onStart}
      disabled={isDiscovering || isLoading}
      style={{
        padding: '6px 12px',
        background: (isDiscovering || isLoading) ? '#1F2937' : '#1D4ED8',
        color: (isDiscovering || isLoading) ? '#64748B' : '#FFF',
        border: 'none',
        borderRadius: 4,
        fontSize: 12,
        cursor: (isDiscovering || isLoading) ? 'not-allowed' : 'pointer',
        fontWeight: 'bold',
      }}
    >
      {isLoading && !isDiscovering ? 'Starting...' : 'Start Discovery'}
    </button>
    <button
      onClick={onStop}
      disabled={!isDiscovering || isLoading}
      style={{
        padding: '6px 12px',
        background: (!isDiscovering || isLoading) ? '#1F2937' : '#991B1B',
        color: (!isDiscovering || isLoading) ? '#64748B' : '#FFF',
        border: 'none',
        borderRadius: 4,
        fontSize: 12,
        cursor: (!isDiscovering || isLoading) ? 'not-allowed' : 'pointer',
        fontWeight: 'bold',
      }}
    >
      Stop Discovery
    </button>
  </div>
);