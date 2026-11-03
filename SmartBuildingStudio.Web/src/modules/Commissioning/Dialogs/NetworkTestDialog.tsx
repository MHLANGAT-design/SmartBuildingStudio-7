// src/modules/Commissioning/Dialogs/NetworkTestDialog.tsx

import React, { useState } from 'react';
import { Modal, Footer, Field, inputStyle, errorStyle } from '@/modules/Commissioning/Dialogs/StartCommissioningDialog';
import { useNetworkTesting } from '@/modules/Commissioning/hooks/useNetworkTesting';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworkTestDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const { runNetworkTest, isTesting } = useNetworkTesting();
  const [gatewayId, setGatewayId] = useState('gw-001');
  const [lineId, setLineId] = useState('line-01');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRun = async () => {
    if (!gatewayId || !lineId) {
      setError('Gateway and Line are required.');
      return;
    }
    try {
      setError(null);
      await runNetworkTest(gatewayId, lineId);
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Modal onClose={onClose} title="Network Verification Test">
      <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 16 }}>
        Run a full diagnostic sweep on the target DALI line.
      </div>
      {error && <div style={errorStyle}>{error}</div>}
      <Field label="Gateway ID">
        <input type="text" value={gatewayId} onChange={e => setGatewayId(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Line ID">
        <input type="text" value={lineId} onChange={e => setLineId(e.target.value)} style={inputStyle} />
      </Field>
      <Footer 
        onCancel={onClose} 
        onConfirm={handleRun} 
        confirmLabel={isTesting ? 'Testing...' : 'Run Network Test'} 
        confirmDisabled={isTesting} 
      />
    </Modal>
  );
};