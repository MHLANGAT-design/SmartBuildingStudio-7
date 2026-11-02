// src/modules/DaliProgrammingStudio/Toolbar/groups/DeploymentGroup.tsx

import React from 'react';
import { DeployConfigurationButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/DeployConfigurationButton';

interface Props {
  onDeployClick: () => void;
}

export const DeploymentGroup: React.FC<Props> = ({ onDeployClick }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    <DeployConfigurationButton onClick={onDeployClick} />
  </div>
);