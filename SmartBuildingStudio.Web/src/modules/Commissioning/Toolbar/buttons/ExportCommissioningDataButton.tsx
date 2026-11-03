// src/modules/Commissioning/Toolbar/buttons/ExportCommissioningDataButton.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectFinalReport } from '@/modules/Commissioning/store/commissioningSelectors';
import { ExportService } from '@/modules/Commissioning/services/ExportService';

export const ExportCommissioningDataButton: React.FC = () => {
  const report = useAppSelector(selectFinalReport);

  const handleExport = () => {
    if (report) {
      ExportService.downloadReportAsJson(report);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={!report}
      style={{
        padding: '4px 10px',
        background: !report ? '#1F2937' : '#1E293B',
        color: !report ? '#64748B' : '#E5E7EB',
        border: '1px solid #334155',
        borderRadius: 3,
        fontSize: 10,
        cursor: !report ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      Export JSON
    </button>
  );
};