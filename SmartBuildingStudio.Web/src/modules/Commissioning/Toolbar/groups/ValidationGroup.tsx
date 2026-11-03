// src/modules/Commissioning/Toolbar/groups/ValidationGroup.tsx

import React from 'react';
import { useFaultDetection } from '@/modules/Commissioning/hooks/useFaultDetection';
import { useCommissioningWorkflow } from '@/modules/Commissioning/hooks/useCommissioningWorkflow';

interface Props {
  onOpenReportDialog: () => void;
}

export const ValidationGroup: React.FC<Props> = ({ onOpenReportDialog }) => {
  const { hasCriticalFaults, faultCount } = useFaultDetection();
  const { isGenerating } = useCommissioningWorkflow();

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button
        onClick={onOpenReportDialog}
        disabled={isGenerating || hasCriticalFaults}
        style={{
          padding: '4px 10px',
          background: hasCriticalFaults ? '#3F1D1D' : isGenerating ? '#1F2937' : '#1E293B',
          color: hasCriticalFaults ? '#F87171' : isGenerating ? '#64748B' : '#E5E7EB',
          border: `1px solid ${hasCriticalFaults ? '#F87171' : '#334155'}`,
          borderRadius: 3,
          fontSize: 10,
          cursor: (isGenerating || hasCriticalFaults) ? 'not-allowed' : 'pointer',
        }}
        title={hasCriticalFaults ? 'Cannot generate report while critical faults exist.' : ''}
      >
        {isGenerating ? 'Generating...' : hasCriticalFaults ? `Blocked (${faultCount} Faults)` : 'Generate Report'}
      </button>
    </div>
  );
};