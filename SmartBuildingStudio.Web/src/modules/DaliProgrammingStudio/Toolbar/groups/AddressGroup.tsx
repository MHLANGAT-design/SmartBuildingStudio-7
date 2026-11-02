// src/modules/DaliProgrammingStudio/Toolbar/groups/AddressGroup.tsx

import React from 'react';
import { AssignAddressesButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/AssignAddressesButton';

export const AddressGroup: React.FC = () => (
  <div style={{ display: 'flex', gap: 4 }}>
    <AssignAddressesButton />
  </div>
);