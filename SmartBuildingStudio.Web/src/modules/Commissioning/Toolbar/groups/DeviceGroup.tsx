// src/modules/Commissioning/Toolbar/groups/DeviceGroup.tsx

import React from 'react';
import { useDeviceDiscovery } from '@/modules/Commissioning/hooks/useDeviceDiscovery';
import { useCommissioning } from '@/modules/Commissioning/hooks/useCommissioning';

interface Props {
  onOpenDiscoverDialog: () => void;
  onOpenAddressDialog: () => void;
}

export const DeviceGroup: React.FC<Props> = ({ onOpenDiscoverDialog, onOpenAddressDialog }) => {
  const { isDiscovering } = useDeviceDiscovery();
  const { isActive } = useCommissioning();

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <ToolbarButton onClick={onOpenDiscoverDialog} disabled={!isActive || isDiscovering}>
        {isDiscovering ? 'Discovering...' : 'Discover Devices'}
      </ToolbarButton>
      <ToolbarButton onClick={onOpenAddressDialog} disabled={!isActive}>
        Auto-Address
      </ToolbarButton>
    </div>
  );
};

// Shared mini-component for toolbar buttons
const ToolbarButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '4px 10px',
      background: disabled ? '#1F2937' : '#1E293B',
      color: disabled ? '#64748B' : '#E5E7EB',
      border: '1px solid #334155',
      borderRadius: 3,
      fontSize: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </button>
);