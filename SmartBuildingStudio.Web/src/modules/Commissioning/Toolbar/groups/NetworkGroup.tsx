// src/modules/Commissioning/Toolbar/groups/NetworkGroup.tsx

import React from 'react';
import { useNetworkTesting } from '@/modules/Commissioning/hooks/useNetworkTesting';

interface Props {
  onOpenNetworkTestDialog: () => void;
}

export const NetworkGroup: React.FC<Props> = ({ onOpenNetworkTestDialog }) => {
  const { isTesting } = useNetworkTesting();

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button
        onClick={onOpenNetworkTestDialog}
        disabled={isTesting}
        style={{
          padding: '4px 10px',
          background: isTesting ? '#1F2937' : '#1E293B',
          color: isTesting ? '#64748B' : '#E5E7EB',
          border: '1px solid #334155',
          borderRadius: 3,
          fontSize: 10,
          cursor: isTesting ? 'not-allowed' : 'pointer',
        }}
      >
        {isTesting ? 'Testing Network...' : 'Test Network'}
      </button>
    </div>
  );
};