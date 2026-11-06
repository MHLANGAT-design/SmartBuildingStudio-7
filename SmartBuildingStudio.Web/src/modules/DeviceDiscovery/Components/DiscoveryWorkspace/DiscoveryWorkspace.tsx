// src/modules/DeviceDiscovery/Components/DiscoveryWorkspace/DiscoveryWorkspace.tsx

import React from 'react';
import { DiscoveryWorkspaceLayout } from '@/modules/DeviceDiscovery/Components/DiscoveryWorkspace/DiscoveryWorkspaceLayout';
import { DiscoveryWorkspaceHeader } from '@/modules/DeviceDiscovery/Components/DiscoveryWorkspace/DiscoveryWorkspaceHeader';

interface Props {
  children: React.ReactNode;
}

export const DiscoveryWorkspace: React.FC<Props> = ({ children }) => (
  <DiscoveryWorkspaceLayout>
    <DiscoveryWorkspaceHeader />
    {children}
  </DiscoveryWorkspaceLayout>
);