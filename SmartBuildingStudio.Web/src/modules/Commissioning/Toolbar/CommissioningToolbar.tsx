// src/modules/Commissioning/Toolbar/CommissioningToolbar.tsx

import React from 'react';
import { SessionGroup } from '@/modules/Commissioning/Toolbar/groups/SessionGroup';
import { DeviceGroup } from '@/modules/Commissioning/Toolbar/groups/DeviceGroup';
import { NetworkGroup } from '@/modules/Commissioning/Toolbar/groups/NetworkGroup';
import { TestingGroup } from '@/modules/Commissioning/Toolbar/groups/TestingGroup';
import { ValidationGroup } from '@/modules/Commissioning/Toolbar/groups/ValidationGroup';
import { ExportGroup } from '@/modules/Commissioning/Toolbar/groups/ExportGroup';

interface Props {
  onOpenStartDialog: () => void;
  onOpenDiscoverDialog: () => void;
  onOpenAddressDialog: () => void;
  onOpenNetworkTestDialog: () => void;
  onOpenSceneTestDialog: () => void;
  onOpenReportDialog: () => void;
  onOpenFaultsPanel?: () => void;
  onOpenResolveConflicts?: () => void;
}

export const CommissioningToolbar: React.FC<Props> = ({
  onOpenStartDialog,
  onOpenDiscoverDialog,
  onOpenAddressDialog,
  onOpenNetworkTestDialog,
  onOpenSceneTestDialog,
  onOpenReportDialog,
  onOpenFaultsPanel,
  onOpenResolveConflicts,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 12px',
        background: '#0F1424',
        borderBottom: '1px solid #1F2937',
        flexWrap: 'wrap',
      }}
    >
      <SessionGroup onOpenStartDialog={onOpenStartDialog} />
      <Divider />
      <DeviceGroup
        onOpenDiscoverDialog={onOpenDiscoverDialog}
        onOpenAddressDialog={onOpenAddressDialog}
      />
      <Divider />
      <NetworkGroup
        onOpenNetworkTestDialog={onOpenNetworkTestDialog}
        onOpenFaultsPanel={onOpenFaultsPanel}
      />
      <Divider />
      <TestingGroup onOpenSceneTestDialog={onOpenSceneTestDialog} />
      <Divider />
      <ValidationGroup
        onOpenReportDialog={onOpenReportDialog}
        onOpenResolveConflicts={onOpenResolveConflicts}
      />
      <Divider />
      <ExportGroup />
    </div>
  );
};

const Divider: React.FC = () => (
  <div style={{ width: 1, height: 20, background: '#1F2937', margin: '0 4px', flexShrink: 0 }} />
);