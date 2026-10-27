// src/modules/EmergencyLighting/Toolbar/groups/ComplianceGroup.tsx

import React from 'react';
import { AddExitRouteButton } from '@/modules/EmergencyLighting/Toolbar/buttons/AddExitRouteButton';

export const ComplianceGroup: React.FC = () => {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <AddExitRouteButton />
    </div>
  );
};

export default ComplianceGroup;