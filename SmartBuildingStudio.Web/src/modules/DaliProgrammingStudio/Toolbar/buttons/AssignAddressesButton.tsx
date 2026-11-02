// src/modules/DaliProgrammingStudio/Toolbar/buttons/AssignAddressesButton.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign, selectProgrammingPlan } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
import { appendSequencesToPlan } from '@/modules/DaliProgrammingStudio/store/programmingSlice';
import { AddressingManager } from '@/modules/DaliProgrammingStudio/Addressing/AddressingManager';

export const AssignAddressesButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const design = useAppSelector(selectApprovedDesign);
  const plan = useAppSelector(selectProgrammingPlan);
  
  const disabled = !design || !plan;

  const handleClick = () => {
    if (!design) return;
    const manager = new AddressingManager();
    
    // Plan the addressing
    const result = manager.planAddressing(design.devices);
    if (!result.success) {
      alert(`Cannot assign addresses: ${result.conflicts.length} conflicts detected.`);
      return;
    }

    // Generate the commands and append to the plan
    const sequences = manager.buildAddressingSequences(result);
    dispatch(appendSequencesToPlan(sequences));
    alert(`Added ${sequences.length} addressing sequences to the programming plan.`);
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
      Assign Addresses
    </button>
  );
};