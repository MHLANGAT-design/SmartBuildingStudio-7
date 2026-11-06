// src/modules/DeviceDiscovery/Components/DiscoveryWorkspace/DiscoveryWorkspaceLayout.tsx

import React from 'react';

interface Props {
  children: React.ReactNode;
}

export const DiscoveryWorkspaceLayout: React.FC<Props> = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    {children}
  </div>
);