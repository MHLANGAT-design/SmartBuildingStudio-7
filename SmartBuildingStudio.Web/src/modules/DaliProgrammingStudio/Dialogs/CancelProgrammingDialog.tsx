// src/modules/DaliProgrammingStudio/Dialogs/CancelProgrammingDialog.tsx

import React from 'react';
import { Modal, Footer } from '@/modules/DaliProgrammingStudio/Dialogs/LoadDesignDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: () => void;
}

export const CancelProgrammingDialog: React.FC<Props> = ({ isOpen, onClose, onConfirmCancel }) => {
  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} title="Cancel Programming?">
      <div style={{ color: '#E5E7EB', fontSize: 11, lineHeight: 1.6, marginBottom: 12 }}>
        Cancelling mid-deployment may leave devices in an inconsistent state. Some devices may remain unprogrammed.
      </div>
      <div style={{ color: '#FBBF24', fontSize: 10, padding: 8, background: '#3D2E0A', borderRadius: 4, marginBottom: 12 }}>
        You should verify the deployment afterwards to identify any devices that need re-programming.
      </div>
      <Footer onCancel={onClose} onConfirm={onConfirmCancel} confirmLabel="Cancel Programming" danger />
    </Modal>
  );
};