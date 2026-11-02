// src/modules/DaliProgrammingStudio/Dialogs/AddressAssignmentDialog.tsx

import React from 'react';
import { Modal, Footer } from '@/modules/DaliProgrammingStudio/Dialogs/LoadDesignDialog';
import type { AddressingResult } from '@/modules/DaliProgrammingStudio/Addressing/AddressingResult';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: AddressingResult | null;
  onConfirm: () => void;
}

export const AddressAssignmentDialog: React.FC<Props> = ({ isOpen, onClose, result, onConfirm }) => {
  if (!isOpen || !result) return null;

  return (
    <Modal onClose={onClose} title="Address Assignment">
      {!result.success && result.conflicts.length > 0 && (
        <div style={{ padding: 10, background: '#3F1D1D', border: '1px solid #F87171', borderRadius: 4, marginBottom: 12 }}>
          <div style={{ color: '#F87171', fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>
            {result.conflicts.length} conflict(s) detected
          </div>
          {result.conflicts.slice(0, 5).map(c => (
            <div key={c.issueId} style={{ fontSize: 10, color: '#94A3B8' }}>• {c.message}</div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <Stat label="Assigned" value={result.assignedCount} color="#4ADE80" />
        <Stat label="Unassigned" value={result.unassignedDevices.length} color="#F87171" />
      </div>

      <div style={{ maxHeight: 200, overflow: 'auto' }}>
        {result.mappings.slice(0, 20).map(m => (
          <div key={m.deviceId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: 3, borderBottom: '1px solid #1F2937' }}>
            <span style={{ color: '#E5E7EB' }}>{m.deviceId}</span>
            <span style={{ color: '#38BDF8', fontFamily: 'monospace' }}>→ {m.shortAddress}</span>
          </div>
        ))}
      </div>

      <Footer
        onCancel={onClose}
        onConfirm={onConfirm}
        confirmLabel="Apply Addresses"
        confirmDisabled={!result.success}
      />
    </Modal>
  );
};

const Stat: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{ background: '#0A0F1E', border: '1px solid #1F2937', borderRadius: 4, padding: 8 }}>
    <div style={{ color: '#64748B', fontSize: 9, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ color, fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' }}>{value}</div>
  </div>
);