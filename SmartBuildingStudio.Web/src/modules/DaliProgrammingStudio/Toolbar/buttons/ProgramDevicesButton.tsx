// src/modules/DaliProgrammingStudio/Toolbar/buttons/ProgramDevicesButton.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign, selectProgrammingPlan } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
import { appendSequencesToPlan } from '@/modules/DaliProgrammingStudio/store/programmingSlice';
import { DeviceConfigurationManager } from '@/modules/DaliProgrammingStudio/Configuration/DeviceConfigurationManager';

export const ProgramDevicesButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const design = useAppSelector(selectApprovedDesign);
  const plan = useAppSelector(selectProgrammingPlan);
  
  const disabled = !design || !plan;

  const handleClick = () => {
    if (!design) return;
    const manager = new DeviceConfigurationManager();
    const sequences = manager.buildSequencesForAll(design.devices);
    
    if (sequences.length === 0) {
      alert('No configuration commands were generated for these devices.');
      return;
    }

    dispatch(appendSequencesToPlan(sequences));
    alert(`Added ${sequences.length} configuration sequences to the plan.`);
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
      Program Devices
    </button>
  );
};