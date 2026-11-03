// src/modules/Commissioning/Toolbar/groups/ExportGroup.tsx

import React from 'react';
import { ExportCommissioningDataButton } from '@/modules/Commissioning/Toolbar/buttons/ExportCommissioningDataButton';

export const ExportGroup: React.FC = () => {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <ExportCommissioningDataButton />
    </div>
  );
};