// src/modules/DaliProgrammingStudio/Toolbar/buttons/CompileConfigurationButton.tsx

import React, { useState } from 'react';
import { useWorkspaceServices } from '@/modules/DaliProgrammingStudio/Workspace/ProgrammingWorkspaceContext';
import { useProgrammingPlan } from '@/modules/DaliProgrammingStudio/hooks/useProgrammingPlan';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const CompileConfigurationButton: React.FC = () => {
  const services = useWorkspaceServices();
  const design = useAppSelector(selectApprovedDesign);
  const { compile, isCompiling } = useProgrammingPlan(services.programmingService);
  
  const [flash, setFlash] = useState(false);

  const handleClick = async () => {
    if (!design) {
      alert('Please Load Design first before compiling.');
      return;
    }
    await compile();
    setFlash(true);
    setTimeout(() => setFlash(false), 1000);
  };

  const disabled = isCompiling;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={{
        padding: '4px 10px',
        background: flash ? '#4ADE80' : disabled ? '#1F2937' : !design ? '#3F1D1D' : '#1E293B',
        color: disabled ? '#64748B' : flash ? '#0A0F1E' : '#E5E7EB',
        border: '1px solid #334155',
        borderRadius: 3,
        fontSize: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background 0.2s'
      }}
    >
      {isCompiling ? 'Compiling...' : flash ? 'Compiled!' : 'Compile'}
    </button>
  );
};