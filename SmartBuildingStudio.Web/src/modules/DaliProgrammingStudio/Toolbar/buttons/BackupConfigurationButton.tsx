// src/modules/DaliProgrammingStudio/Toolbar/buttons/BackupConfigurationButton.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const BackupConfigurationButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const design = useAppSelector(selectApprovedDesign);
  const disabled = !design;

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
      Backup
    </button>
  );
};