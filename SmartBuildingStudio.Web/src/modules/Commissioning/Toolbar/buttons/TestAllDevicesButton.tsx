// src/modules/Commissioning/Toolbar/buttons/TestAllDevicesButton.tsx

import React from 'react';
import { useNetworkTesting } from '@/modules/Commissioning/hooks/useNetworkTesting';

interface Props {
  onClick: () => void;
}

export const TestAllDevicesButton: React.FC<Props> = ({ onClick }) => {
  const { isTesting } = useNetworkTesting();

  return (
    <button
      onClick={onClick}
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
      {isTesting ? 'Testing...' : 'Test All Devices'}
    </button>
  );
};