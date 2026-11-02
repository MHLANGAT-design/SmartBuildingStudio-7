// src/modules/DaliProgrammingStudio/Dialogs/RestoreConfigurationDialog.tsx

import React, { useState } from 'react';
import { Modal, Footer, errorStyle, inputStyle } from '@/modules/DaliProgrammingStudio/Dialogs/LoadDesignDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (jsonString: string) => void;
}

export const RestoreConfigurationDialog: React.FC<Props> = ({ isOpen, onClose, onRestore }) => {
  const [jsonString, setJsonString] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRestore = () => {
    if (!jsonString.trim()) {
      setError('Please paste the backup JSON or load a file.');
      return;
    }
    try {
      onRestore(jsonString);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Modal onClose={onClose} title="Restore Configuration">
      <div style={{ padding: 10, background: '#3F1D1D', border: '1px solid #F87171', borderRadius: 4, marginBottom: 12 }}>
        <div style={{ color: '#F87171', fontSize: 11, fontWeight: 'bold' }}>
          ⚠ Restoring a backup will overwrite the current physical configuration.
        </div>
      </div>
      {error && <div style={errorStyle}>{error}</div>}
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#94A3B8', fontSize: 10, marginBottom: 4 }}>Paste backup JSON:</div>
        <textarea
          value={jsonString}
          onChange={e => setJsonString(e.target.value)}
          rows={8}
          style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' }}
        />
      </div>
      <Footer onCancel={onClose} onConfirm={handleRestore} confirmLabel="Restore" danger />
    </Modal>
  );
};