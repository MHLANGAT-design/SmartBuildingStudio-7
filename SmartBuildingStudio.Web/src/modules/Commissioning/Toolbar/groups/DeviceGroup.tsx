// src/modules/Commissioning/Toolbar/groups/DeviceGroup.tsx

import React from 'react';
import { useAppDispatch } from '@/Application/ConfigureStore';
import { useCommissioning } from '@/modules/Commissioning/hooks/useCommissioning';
import { DiscoverDevicesButton } from '@/modules/Commissioning/Toolbar/buttons/DiscoverDevicesButton';
import { AutoAddressDevicesButton } from '@/modules/Commissioning/Toolbar/buttons/AutoAddressDevicesButton';
import { ManualAddressDevicesButton } from '@/modules/Commissioning/Toolbar/buttons/ManualAddressDevicesButton';
import { SyncDevicesButton } from '@/modules/Commissioning/Toolbar/buttons/SyncDevicesButton';

interface Props {
  onOpenDiscoverDialog: () => void;
  onOpenAddressDialog: () => void;
}

export const DeviceGroup: React.FC<Props> = ({ onOpenDiscoverDialog, onOpenAddressDialog }) => {
  const { session } = useCommissioning();

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <DiscoverDevicesButton onClick={onOpenDiscoverDialog} />
      <AutoAddressDevicesButton onClick={onOpenAddressDialog} />
      <ManualAddressDevicesButton onClick={onOpenAddressDialog} />
      <SyncDevicesButton
        onClick={() => {
          // TODO: dispatch a sync thunk if/when one exists.
          // For now this re-uses the discovery dialog as a placeholder.
          onOpenDiscoverDialog();
        }}
      />
    </div>
  );
};