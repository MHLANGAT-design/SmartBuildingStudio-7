// src/modules/DaliProgrammingStudio/Dialogs/DeploymentConfirmationDialog.tsx

import React, { useState } from 'react';
import { Modal, Footer } from '@/modules/DaliProgrammingStudio/Dialogs/LoadDesignDialog';
import type { ProgrammingPlan } from '@/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  plan: ProgrammingPlan | null;
  gatewayName: string;
  lineName: string;
  onConfirm: () => void;
}

export const DeploymentConfirmationDialog: React.FC<Props> = ({ isOpen, onClose, plan, gatewayName, lineName, onConfirm }) => {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen || !plan) return null;

  return (
    <Modal onClose={onClose} title="Confirm Deployment">
      <div style={{ padding: 10, background: '#3F1D1D', border: '1px solid #F87171', borderRadius: 4, marginBottom: 12 }}>
        <div style={{ color: '#F87171', fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>
          ⚠ Physical Device Programming
        </div>
        <div style={{ color: '#94A3B8', fontSize: 10, lineHeight: 1.5 }}>
          This will send {plan.totalCommands} commands to the physical DALI bus. Devices may change state during programming.
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Row label="Gateway" value={gatewayName} />
        <Row label="Line" value={lineName} />
        <Row label="Sequences" value={String(plan.sequences.length)} />
        <Row label="Commands" value={String(plan.totalCommands)} />
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 11, color: '#E5E7EB' }}>
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={e => setAcknowledged(e.target.checked)}
          style={{ marginTop: 2 }}
        />
        <span>I confirm I have verified the target gateway and line, and authorize programming.</span>
      </label>

      <Footer onCancel={onClose} onConfirm={onConfirm} confirmLabel="Deploy" confirmDisabled={!acknowledged} danger />
    </Modal>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{ color: '#E5E7EB', fontFamily: 'monospace' }}>{value}</span>
  </div>
);