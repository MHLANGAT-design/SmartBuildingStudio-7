// src/modules/Commissioning/Toolbar/CommissioningToolbar.tsx

import React from 'react';
import { DeviceGroup } from '@/modules/Commissioning/Toolbar/groups/DeviceGroup';
import { NetworkGroup } from '@/modules/Commissioning/Toolbar/groups/NetworkGroup';
import { TestingGroup } from '@/modules/Commissioning/Toolbar/groups/TestingGroup';
import { ValidationGroup } from '@/modules/Commissioning/Toolbar/groups/ValidationGroup';
import { ExportGroup } from '@/modules/Commissioning/Toolbar/groups/ExportGroup';

interface Props {
  onOpenDiscoverDialog: () => void;
  onOpenAddressDialog: () => void;
  onOpenNetworkTestDialog: () => void;
  onOpenSceneTestDialog: () => void;
  onOpenReportDialog: () => void;
}

export const CommissioningToolbar: React.FC<Props> = ({
  onOpenDiscoverDialog,
  onOpenAddressDialog,
  onOpenNetworkTestDialog,
  onOpenSceneTestDialog,
  onOpenReportDialog,
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
      <DeviceGroup 
        onOpenDiscoverDialog={onOpenDiscoverDialog} 
        onOpenAddressDialog={onOpenAddressDialog} 
      />
      <Divider />
      <NetworkGroup onOpenNetworkTestDialog={onOpenNetworkTestDialog} />
      <Divider />
      <TestingGroup onOpenSceneTestDialog={onOpenSceneTestDialog} />
      <Divider />
      <ValidationGroup onOpenReportDialog={onOpenReportDialog} />
      <Divider />
      <ExportGroup />
    </div>
  );
};

const Divider: React.FC = () => (
  <div style={{ width: 1, height: 20, background: '#1F2937', margin: '0 4px', flexShrink: 0 }} />
);