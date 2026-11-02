// src/modules/DaliProgrammingStudio/Dialogs/CompileConfigurationDialog.tsx

import React from 'react';
import { Modal, Footer } from '@/modules/DaliProgrammingStudio/Dialogs/LoadDesignDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isCompiling: boolean;
  warnings: string[];
  error: string | null;
  onCompile: () => void;
}

export const CompileConfigurationDialog: React.FC<Props> = ({ isOpen, onClose, isCompiling, warnings, error, onCompile }) => {
  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} title="Compile Configuration">
      {isCompiling ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ color: '#38BDF8', fontSize: 13 }}>Compiling design...</div>
          <div style={{ color: '#64748B', fontSize: 11, marginTop: 8 }}>Validating devices, resolving dependencies, generating commands</div>
        </div>
      ) : (
        <>
          {error && (
            <div style={{ padding: 10, background: '#3F1D1D', border: '1px solid #F87171', borderRadius: 4, color: '#F87171', fontSize: 11, marginBottom: 12 }}>
              {error}
            </div>
          )}
          {warnings.length > 0 && (
            <div>
              <div style={{ color: '#FBBF24', fontSize: 11, marginBottom: 6 }}>Warnings ({warnings.length})</div>
              {warnings.map((w, i) => (
                <div key={i} style={{ fontSize: 10, color: '#94A3B8', paddingLeft: 8, marginBottom: 3 }}>
                  ⚠ {w}
                </div>
              ))}
            </div>
          )}
          {!error && warnings.length === 0 && (
            <div style={{ color: '#4ADE80', fontSize: 11 }}>✓ Design is ready to compile.</div>
          )}
        </>
      )}
      <Footer
        onCancel={onClose}
        onConfirm={onCompile}
        confirmLabel={isCompiling ? 'Compiling...' : 'Compile'}
        confirmDisabled={isCompiling}
      />
    </Modal>
  );
};