// src/modules/DaliProgrammingStudio/Toolbar/buttons/DeployConfigurationButton.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectProgrammingPlan, selectIsDeploying } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

interface Props {
  onClick: () => void;
}

export const DeployConfigurationButton: React.FC<Props> = ({ onClick }) => {
  const plan = useAppSelector(selectProgrammingPlan);
  const isDeploying = useAppSelector(selectIsDeploying);

  const disabled = !plan || isDeploying;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 10px',
        background: disabled ? '#1F2937' : '#1D4ED8',
        color: disabled ? '#64748B' : '#FFF',
        border: '1px solid #334155',
        borderRadius: 3,
        fontSize: 10,
        fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {isDeploying ? 'Deploying...' : 'Deploy'}
    </button>
  );
};