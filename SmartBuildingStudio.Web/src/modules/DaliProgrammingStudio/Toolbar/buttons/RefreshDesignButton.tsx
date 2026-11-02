// src/modules/DaliProgrammingStudio/Toolbar/buttons/RefreshDesignButton.tsx

import React from 'react';
import { useDaliDesign } from '@/modules/DaliProgrammingStudio/hooks/useDaliDesign';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const RefreshDesignButton: React.FC = () => {
  const { loadDesign } = useDaliDesign();
  const design = useAppSelector(selectApprovedDesign);

  const handleClick = () => {
    if (design?.topology.projectId) {
      loadDesign(); // Fixed: No arguments required
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!design}
      style={{
        padding: '4px 10px',
        background: !design ? '#1F2937' : '#1E293B',
        color: !design ? '#64748B' : '#E5E7EB',
        border: '1px solid #334155',
        borderRadius: 3,
        fontSize: 10,
        cursor: !design ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      Refresh
    </button>
  );
};