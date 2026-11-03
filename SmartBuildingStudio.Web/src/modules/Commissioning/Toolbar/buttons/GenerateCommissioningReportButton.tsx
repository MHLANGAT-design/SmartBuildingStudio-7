// src/modules/Commissioning/Toolbar/buttons/GenerateCommissioningReportButton.tsx

import React from 'react';
import { useFaultDetection } from '@/modules/Commissioning/hooks/useFaultDetection';
import { useCommissioningWorkflow } from '@/modules/Commissioning/hooks/useCommissioningWorkflow';

interface Props {
  onClick: () => void;
}

export const GenerateCommissioningReportButton: React.FC<Props> = ({ onClick }) => {
  const { hasCriticalFaults, faultCount } = useFaultDetection();
  const { isGenerating } = useCommissioningWorkflow();

  const disabled = isGenerating || hasCriticalFaults;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={hasCriticalFaults ? 'Cannot generate report while critical faults exist.' : ''}
      style={{
        padding: '4px 10px',
        background: hasCriticalFaults ? '#3F1D1D' : isGenerating ? '#1F2937' : '#1E293B',
        color: hasCriticalFaults ? '#F87171' : isGenerating ? '#64748B' : '#E5E7EB',
        border: `1px solid ${hasCriticalFaults ? '#F87171' : '#334155'}`,
        borderRadius: 3,
        fontSize: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {isGenerating ? 'Generating...' : hasCriticalFaults ? `Blocked (${faultCount} Faults)` : 'Generate Report'}
    </button>
  );
};