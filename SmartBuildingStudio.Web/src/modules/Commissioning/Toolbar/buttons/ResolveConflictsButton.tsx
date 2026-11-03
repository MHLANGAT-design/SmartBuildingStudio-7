// src/modules/Commissioning/Toolbar/buttons/ResolveConflictsButton.tsx

import React from 'react';
import { useFaultDetection } from '@/modules/Commissioning/hooks/useFaultDetection';

interface Props {
  onClick: () => void;
}

export const ResolveConflictsButton: React.FC<Props> = ({ onClick }) => {
  const { faults } = useFaultDetection();
  const conflictCount = faults.filter(f => f.category === 'ADDRESS_CONFLICT').length;
  const disabled = conflictCount === 0;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 10px',
        background: disabled ? '#1F2937' : '#3D2E0A',
        color: disabled ? '#64748B' : '#FBBF24',
        border: `1px solid ${disabled ? '#334155' : '#FBBF24'}`,
        borderRadius: 3,
        fontSize: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {disabled ? 'No Conflicts' : `Resolve (${conflictCount})`}
    </button>
  );
};