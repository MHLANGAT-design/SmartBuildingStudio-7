// src/modules/DaliProgrammingStudio/Toolbar/buttons/ValidateConfigurationButton.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectProgrammingPlan } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const ValidateConfigurationButton: React.FC = () => {
  const plan = useAppSelector(selectProgrammingPlan);
  const disabled = !plan;

  return (
    <button
      onClick={() => alert('Validation already performed during compile.')}
      disabled={disabled}
      style={{
        padding: '4px 10px',
        background: disabled ? '#1F2937' : '#1E293B',
        color: disabled ? '#64748B' : '#E5E7EB',
        border: '1px solid #334155',
        borderRadius: 3,
        fontSize: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      Validate
    </button>
  );
};