// src/modules/Commissioning/Dialogs/StartCommissioningDialog.tsx

import React, { useState } from 'react';
import { useCommissioning } from '@/modules/Commissioning/hooks/useCommissioning';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  floorId: string;
}

export const StartCommissioningDialog: React.FC<Props> = ({ isOpen, onClose, projectId, floorId }) => {
  const { startSession, isActive } = useCommissioning();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStart = async () => {
    try {
      setError(null);
      await startSession(projectId, floorId);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to start session');
    }
  };

  return (
    <Modal onClose={onClose} title="Start Commissioning">
      <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 16 }}>
        This will initialize a new field commissioning session for the selected floor plan. 
        Ensure all physical gateways are powered and connected.
      </div>
      {error && <div style={errorStyle}>{error}</div>}
      <Footer 
        onCancel={onClose} 
        onConfirm={handleStart} 
        confirmLabel={isActive ? 'Overwrite Existing Session' : 'Start Session'} 
      />
    </Modal>
  );
};

// ── Shared Modal Primitives ──────────────────────────────────────
export const Modal: React.FC<{ onClose: () => void; title: string; children: React.ReactNode }> = ({ onClose, title, children }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: '#0F1424', border: '1px solid #334155', borderRadius: 8, width: 480, maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: 13 }}>{title}</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 18, cursor: 'pointer' }}>×</button>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  </div>
);

export const Footer: React.FC<{ onCancel: () => void; onConfirm: () => void; confirmLabel: string; confirmDisabled?: boolean; danger?: boolean }> = ({ onCancel, onConfirm, confirmLabel, confirmDisabled, danger }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid #1F2937' }}>
    <button onClick={onCancel} style={btnStyle}>Cancel</button>
    <button onClick={onConfirm} disabled={confirmDisabled} style={{ ...btnStyle, background: confirmDisabled ? '#1F2937' : danger ? '#991B1B' : '#1D4ED8', color: confirmDisabled ? '#64748B' : '#FFF', cursor: confirmDisabled ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
      {confirmLabel}
    </button>
  </div>
);

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
    {children}
  </div>
);

const btnStyle: React.CSSProperties = { padding: '6px 14px', background: '#1E293B', color: '#E5E7EB', border: '1px solid #334155', borderRadius: 4, fontSize: 11, cursor: 'pointer' };
export const inputStyle: React.CSSProperties = { width: '100%', padding: '6px 10px', background: '#0A0F1E', color: '#E5E7EB', border: '1px solid #334155', borderRadius: 4, fontSize: 12, fontFamily: 'monospace', boxSizing: 'border-box' };
export const errorStyle: React.CSSProperties = { padding: '6px 10px', background: '#3F1D1D', border: '1px solid #F87171', borderRadius: 4, color: '#F87171', fontSize: 11, marginBottom: 8 };