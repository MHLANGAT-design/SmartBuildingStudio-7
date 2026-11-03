// src/modules/Commissioning/Toolbar/buttons/DiscoverDevicesButton.tsx

import React from 'react';
import { useDeviceDiscovery } from '@/modules/Commissioning/hooks/useDeviceDiscovery';

interface Props {
  onClick: () => void;
}

export const DiscoverDevicesButton: React.FC<Props> = ({ onClick }) => {
  const { isDiscovering } = useDeviceDiscovery();

  return (
    <button
      onClick={onClick}
      disabled={isDiscovering}
      style={{
        padding: '4px 10px',
        background: isDiscovering ? '#1F2937' : '#1E293B',
        color: isDiscovering ? '#64748B' : '#E5E7EB',
        border: '1px solid #334155',
        borderRadius: 3,
        fontSize: 10,
        cursor: isDiscovering ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {isDiscovering ? 'Discovering...' : 'Discover Devices'}
    </button>
  );
};