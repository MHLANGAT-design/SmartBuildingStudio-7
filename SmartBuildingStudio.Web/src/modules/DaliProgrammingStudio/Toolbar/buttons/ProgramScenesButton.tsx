// src/modules/DaliProgrammingStudio/Toolbar/buttons/ProgramScenesButton.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign, selectProgrammingPlan } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
import { appendSequencesToPlan } from '@/modules/DaliProgrammingStudio/store/programmingSlice';
import { DeviceConfigurationManager } from '@/modules/DaliProgrammingStudio/Configuration/DeviceConfigurationManager';

export const ProgramScenesButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const design = useAppSelector(selectApprovedDesign);
  const plan = useAppSelector(selectProgrammingPlan);
  const disabled = !design || !plan;

  const handleClick = () => {
    if (!design) return;
    const manager = new DeviceConfigurationManager();
    
    // Build only scene sequences
    const allSequences = manager.buildSequencesForAll(design.devices);
    const sceneSequences = allSequences.filter(s => s.id.startsWith('seq_scenes_'));
    
    if (sceneSequences.length === 0) {
      alert('No scene programming commands were generated.');
      return;
    }

    dispatch(appendSequencesToPlan(sceneSequences));
    alert(`Added ${sceneSequences.length} scene sequences to the plan.`);
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
      Program Scenes
    </button>
  );
};