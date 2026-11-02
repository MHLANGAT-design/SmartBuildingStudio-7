// src/modules/DaliProgrammingStudio/Dialogs/BackupConfigurationDialog.tsx

import React, { useState } from 'react';
import { Modal, Footer, Field, inputStyle } from '@/modules/DaliProgrammingStudio/Dialogs/LoadDesignDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateBackup: (comment: string) => void;
}

export const BackupConfigurationDialog: React.FC<Props> = ({ isOpen, onClose, onCreateBackup }) => {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} title="Backup Configuration">
      <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 12 }}>
        Save a snapshot of the current physical configuration. This can be restored later if needed.
      </div>
      <Field label="Comment (optional)">
        <input
          type="text"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="e.g. Before re-addressing group 3"
          style={inputStyle}
        />
      </Field>
      <Footer onCancel={onClose} onConfirm={() => onCreateBackup(comment)} confirmLabel="Create Backup" />
    </Modal>
  );
};