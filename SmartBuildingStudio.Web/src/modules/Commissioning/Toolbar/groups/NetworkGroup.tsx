// src/modules/Commissioning/Toolbar/groups/NetworkGroup.tsx

import React from 'react';
import { TestNetworkButton } from '@/modules/Commissioning/Toolbar/buttons/TestNetworkButton';
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
      <DetectFaultsButton onOpenPanel={onOpenFaultsPanel} />
    </div>
  );
};