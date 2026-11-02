// src/modules/DaliProgrammingStudio/Dialogs/ProgrammingPreviewDialog.tsx

import React from 'react';
import { Modal, Footer } from '@/modules/DaliProgrammingStudio/Dialogs/LoadDesignDialog';
import type { ProgrammingPlan } from '@/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  plan: ProgrammingPlan | null;
  onApprove: () => void;
}

export const ProgrammingPreviewDialog: React.FC<Props> = ({ isOpen, onClose, plan, onApprove }) => {
  if (!isOpen || !plan) return null;

  return (
    <Modal onClose={onClose} title="Preview Programming Plan">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        <Stat label="Sequences" value={plan.sequences.length} />
        <Stat label="Commands" value={plan.totalCommands} />
        <Stat label="Devices" value={plan.targetDeviceCount} />
      </div>

      <div style={{ color: '#38BDF8', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 }}>
        First {Math.min(5, plan.sequences.length)} Sequences
      </div>
      <div style={{ maxHeight: 200, overflow: 'auto', background: '#0A0F1E', borderRadius: 4, padding: 8 }}>
        {plan.sequences.slice(0, 5).map(seq => (
          <div key={seq.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #1F2937' }}>
            <div style={{ fontSize: 11, color: '#E5E7EB', fontWeight: 'bold' }}>{seq.id}</div>
            <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'monospace' }}>
              {seq.commands.length} command(s) → device {seq.targetDeviceId || '—'}
            </div>
          </div>
        ))}
        {plan.sequences.length > 5 && (
          <div style={{ fontSize: 10, color: '#64748B', textAlign: 'center', padding: 4 }}>
            + {plan.sequences.length - 5} more sequences
          </div>
        )}
      </div>

      <Footer onCancel={onClose} onConfirm={onApprove} confirmLabel="Approve & Continue" />
    </Modal>
  );
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div style={{ background: '#0A0F1E', border: '1px solid #1F2937', borderRadius: 4, padding: 8 }}>
    <div style={{ color: '#64748B', fontSize: 9, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ color: '#38BDF8', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' }}>{value}</div>
  </div>
);