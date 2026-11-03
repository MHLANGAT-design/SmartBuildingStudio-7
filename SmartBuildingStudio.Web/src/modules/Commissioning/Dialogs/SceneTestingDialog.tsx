// src/modules/Commissioning/Dialogs/SceneTestingDialog.tsx

import React, { useState } from 'react';
import { Modal, Footer, Field, inputStyle, errorStyle } from '@/modules/Commissioning/Dialogs/StartCommissioningDialog';
import { useSceneTesting } from '@/modules/Commissioning/hooks/useSceneTesting';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SceneTestingDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const { runSceneTests, isTesting } = useSceneTesting();
  const [sceneIds, setSceneIds] = useState('scene-1, scene-2');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRun = async () => {
    const ids = sceneIds.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      setError('Please provide at least one scene ID.');
      return;
    }
    try {
      setError(null);
      await runSceneTests(ids);
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Modal onClose={onClose} title="Run Scene Tests">
      <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 16 }}>
        Enter a comma-separated list of Scene IDs to execute and validate.
      </div>
      {error && <div style={errorStyle}>{error}</div>}
      <Field label="Scene IDs">
        <input type="text" value={sceneIds} onChange={e => setSceneIds(e.target.value)} style={inputStyle} />
      </Field>
      <Footer 
        onCancel={onClose} 
        onConfirm={handleRun} 
        confirmLabel={isTesting ? 'Testing...' : 'Run Tests'} 
        confirmDisabled={isTesting} 
      />
    </Modal>
  );
};