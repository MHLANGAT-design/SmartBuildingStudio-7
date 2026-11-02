// src/modules/DaliProgrammingStudio/Toolbar/buttons/ProgramGroupsButton.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign, selectProgrammingPlan } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
import { appendSequencesToPlan } from '@/modules/DaliProgrammingStudio/store/programmingSlice';
import { DeviceConfigurationManager } from '@/modules/DaliProgrammingStudio/Configuration/DeviceConfigurationManager';

export const ProgramGroupsButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const design = useAppSelector(selectApprovedDesign);
  const plan = useAppSelector(selectProgrammingPlan);
  const disabled = !design || !plan;

  const handleClick = () => {
    if (!design) return;
    const manager = new DeviceConfigurationManager();
    
    // Build only group sequences
    const allSequences = manager.buildSequencesForAll(design.devices);
    const groupSequences = allSequences.filter(s => s.id.startsWith('seq_groups_'));
    
    if (groupSequences.length === 0) {
      alert('No group programming commands were generated.');
      return;
    }

    dispatch(appendSequencesToPlan(groupSequences));
    alert(`Added ${groupSequences.length} group sequences to the plan.`);
  };

  return (
    <button
      onClick={handleClick}
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
      Program Groups
    </button>
  );
};