// src/modules/Commissioning/Toolbar/groups/NetworkGroup.tsx

import React from 'react';
import { TestNetworkButton } from '@/modules/Commissioning/Toolbar/buttons/TestNetworkButton';
import { TestAllDevicesButton } from '@/modules/Commissioning/Toolbar/buttons/TestAllDevicesButton';
import { DetectFaultsButton } from '@/modules/Commissioning/Toolbar/buttons/DetectFaultsButton';

interface Props {
  onOpenNetworkTestDialog: () => void;
  onOpenFaultsPanel?: () => void;
}

export const NetworkGroup: React.FC<Props> = ({
  onOpenNetworkTestDialog,
  onOpenFaultsPanel,
}) => {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <TestNetworkButton onClick={onOpenNetworkTestDialog} />
      <TestAllDevicesButton onClick={onOpenNetworkTestDialog} />
      <DetectFaultsButton
        onClick={() => {
          if (onOpenFaultsPanel) onOpenFaultsPanel();
        }}
      />
    </div>
  );
};