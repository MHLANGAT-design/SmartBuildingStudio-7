// src/modules/Commissioning/Dialogs/DeviceDiscoveryDialog.tsx

import React, { useState } from 'react';
import { Modal, Footer, Field, inputStyle, errorStyle } from '@/modules/Commissioning/Dialogs/StartCommissioningDialog';
import { useDeviceDiscovery } from '@/modules/Commissioning/hooks/useDeviceDiscovery';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceDiscoveryDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const { discoverDevices, isDiscovering } = useDeviceDiscovery();
  const [gatewayId, setGatewayId] = useState('gw-001');
  const [lineId, setLineId] = useState('line-01');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDiscover = async () => {
    if (!gatewayId || !lineId) {
      setError('Gateway ID and Line ID are required.');
      return;
    }
    try {
      setError(null);
      await discoverDevices(gatewayId, lineId);
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Modal onClose={onClose} title="Discover Devices">
      <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 16 }}>
        Scan a specific DALI line to find and register physical devices.
      </div>
      {error && <div style={errorStyle}>{error}</div>}
      <Field label="Target Gateway ID">
        <input type="text" value={gatewayId} onChange={e => setGatewayId(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Target Line ID">
        <input type="text" value={lineId} onChange={e => setLineId(e.target.value)} style={inputStyle} />
      </Field>
      <Footer 
        onCancel={onClose} 
        onConfirm={handleDiscover} 
        confirmLabel={isDiscovering ? 'Scanning...' : 'Start Scan'} 
        confirmDisabled={isDiscovering} 
      />
    </Modal>
  );
};