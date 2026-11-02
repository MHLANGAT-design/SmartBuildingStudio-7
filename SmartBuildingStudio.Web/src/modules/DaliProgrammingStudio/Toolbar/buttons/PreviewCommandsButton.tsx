// src/modules/DaliProgrammingStudio/Toolbar/buttons/PreviewCommandsButton.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectProgrammingPlan } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

interface Props {
  onClick: () => void;
}

export const PreviewCommandsButton: React.FC<Props> = ({ onClick }) => {
  const plan = useAppSelector(selectProgrammingPlan);
  const disabled = !plan;

  return (
    <button
      onClick={onClick}
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
      Preview
    </button>
  );
};