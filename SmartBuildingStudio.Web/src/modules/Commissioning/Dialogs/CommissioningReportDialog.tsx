// src/modules/Commissioning/Dialogs/CommissioningReportDialog.tsx

import React from 'react';
import { Modal, Footer } from '@/modules/Commissioning/Dialogs/StartCommissioningDialog';
import { useCommissioningWorkflow } from '@/modules/Commissioning/hooks/useCommissioningWorkflow';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CommissioningReportDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const { report, generateReport, isGenerating } = useCommissioningWorkflow();

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!report) {
      await generateReport();
    }
  };

  return (
    <Modal onClose={onClose} title="Commissioning Report">
      {report ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <Stat label="Total Devices" value={report.totalDevices} />
            <Stat label="Faults" value={report.faults.length} />
          </div>
          <div style={{ padding: 10, background: report.overallStatus === 'READY_FOR_HANDOVER' ? '#143021' : '#3F1D1D', borderRadius: 4, textAlign: 'center', marginBottom: 12 }}>
            <div style={{ color: report.overallStatus === 'READY_FOR_HANDOVER' ? '#4ADE80' : '#F87171', fontWeight: 'bold', fontSize: 12 }}>
              {report.overallStatus.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ color: '#64748B', marginBottom: 12 }}>No report generated yet.</div>
          <button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            style={{ padding: '8px 16px', background: '#1D4ED8', color: '#FFF', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isGenerating ? 'Generating...' : 'Generate Report Now'}
          </button>
        </div>
      )}
      <Footer 
        onCancel={onClose} 
        onConfirm={onClose} 
        confirmLabel="Close" 
      />
    </Modal>
  );
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div style={{ background: '#0A0F1E', border: '1px solid #1F2937', borderRadius: 4, padding: 8, textAlign: 'center' }}>
    <div style={{ color: '#64748B', fontSize: 9, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ color: '#38BDF8', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' }}>{value}</div>
  </div>
);