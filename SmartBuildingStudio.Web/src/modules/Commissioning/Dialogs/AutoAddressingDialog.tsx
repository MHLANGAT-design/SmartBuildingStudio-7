// src/modules/Commissioning/Dialogs/AutoAddressingDialog.tsx

import React from 'react';
import { Modal, Footer } from '@/modules/Commissioning/Dialogs/StartCommissioningDialog';
import { useDeviceDiscovery } from '@/modules/Commissioning/hooks/useDeviceDiscovery';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const AutoAddressingDialog: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const { deviceCount } = useDeviceDiscovery();

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} title="Auto-Assign Addresses">
      <div style={{ padding: 10, background: '#3D2E0A', border: '1px solid #FBBF24', borderRadius: 4, marginBottom: 12 }}>
        <div style={{ color: '#FBBF24', fontSize: 11, fontWeight: 'bold' }}>⚠ Physical Hardware Action</div>
      </div>
      <div style={{ color: '#E5E7EB', fontSize: 12, marginBottom: 12 }}>
        This will assign short addresses (0-63) to {deviceCount} unaddressed devices on the line.
        Do not disconnect power during this process.
      </div>
      <Footer 
        onCancel={onClose} 
        onConfirm={onConfirm} 
        confirmLabel="Run Auto-Addressing" 
      />
    </Modal>
  );
};