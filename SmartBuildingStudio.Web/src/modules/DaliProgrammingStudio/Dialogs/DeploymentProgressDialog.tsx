// src/modules/DaliProgrammingStudio/Dialogs/DeploymentProgressDialog.tsx

import React from 'react';
import { Modal } from '@/modules/DaliProgrammingStudio/Dialogs/LoadDesignDialog';
import type { DeploymentProgress } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentProgress';

interface Props {
  isOpen: boolean;
  progress: DeploymentProgress | null;
}

export const DeploymentProgressDialog: React.FC<Props> = ({ isOpen, progress }) => {
  if (!isOpen || !progress) return null;

  return (
    <Modal onClose={() => {}} title="Deploying...">
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ color: '#38BDF8', fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace' }}>
          {progress.percentage}%
        </div>
      </div>
      <div style={{ height: 6, background: '#1F2937', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ width: `${progress.percentage}%`, height: '100%', background: '#38BDF8', transition: 'width 0.3s' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <Stat label="Completed" value={progress.completedSequences} color="#4ADE80" />
        <Stat label="Failed" value={progress.failedSequences} color="#F87171" />
        <Stat label="Total" value={progress.totalSequences} color="#94A3B8" />
      </div>
    </Modal>
  );
};

const Stat: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{ background: '#0A0F1E', border: '1px solid #1F2937', borderRadius: 4, padding: 8, textAlign: 'center' }}>
    <div style={{ color: '#64748B', fontSize: 9, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ color, fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' }}>{value}</div>
  </div>
);