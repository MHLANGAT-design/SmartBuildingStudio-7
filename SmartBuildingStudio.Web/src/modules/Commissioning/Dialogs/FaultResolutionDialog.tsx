// src/modules/Commissioning/Dialogs/FaultResolutionDialog.tsx

import React, { useState } from 'react';
import { Modal, Footer, Field, inputStyle, errorStyle } from '@/modules/Commissioning/Dialogs/StartCommissioningDialog';
import { useFaultDetection } from '@/modules/Commissioning/hooks/useFaultDetection';
import type { Fault } from '@/modules/Commissioning/models/Fault';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fault: Fault;
}

export const FaultResolutionDialog: React.FC<Props> = ({ isOpen, onClose, fault }) => {
  const { resolveFault } = useFaultDetection();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResolve = async () => {
    if (!notes.trim()) {
      setError('Please provide resolution notes.');
      return;
    }
    try {
      setError(null);
      await resolveFault(fault.faultId, notes);
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Modal onClose={onClose} title="Resolve Fault">
      <div style={{ padding: 10, background: '#3F1D1D', border: '1px solid #F87171', borderRadius: 4, marginBottom: 12 }}>
        <div style={{ color: '#F87171', fontSize: 11, fontWeight: 'bold' }}>{fault.category}</div>
        <div style={{ color: '#E5E7EB', fontSize: 12 }}>{fault.description}</div>
      </div>
      {error && <div style={errorStyle}>{error}</div>}
      <Field label="Resolution Notes">
        <textarea 
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
          rows={3} 
          style={{ ...inputStyle, resize: 'vertical' }} 
          placeholder="Describe how this fault was physically resolved..."
        />
      </Field>
      <Footer 
        onCancel={onClose} 
        onConfirm={handleResolve} 
        confirmLabel="Mark Resolved" 
      />
    </Modal>
  );
};