// src/modules/DaliProgrammingStudio/Toolbar/groups/ConfigurationGroup.tsx

import React from 'react';
import { ProgramGroupsButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/ProgramGroupsButton';
import { ProgramScenesButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/ProgramScenesButton';
import { ProgramDevicesButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/ProgramDevicesButton';

export const ConfigurationGroup: React.FC = () => (
  <div style={{ display: 'flex', gap: 4 }}>
    <ProgramDevicesButton />
    <ProgramGroupsButton />
    <ProgramScenesButton />
  </div>
);