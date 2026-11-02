// src/modules/DaliProgrammingStudio/Dialogs/LoadDesignDialog.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LoadDesignDialog: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const daliDoc = useAppSelector((s: any) => s.dali?.document);

  if (!isOpen) return null;

  const deviceCount = daliDoc?.devices?.length ?? 0;
  const lineCount = daliDoc?.lines?.length ?? 0;
  const groupCount = daliDoc?.groups?.length ?? 0;
  const sceneCount = daliDoc?.scenes?.length ?? 0;

  const hasDesign = deviceCount > 0;

  return (
    <Modal onClose={onClose} title="Load Approved Design">
      <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 16 }}>
        This will import the currently active DALI design from DaliDesigner into the Programming Studio.
      </div>

      <div style={{ background: '#0A0F1E', padding: 12, borderRadius: 4, border: '1px solid #1F2937', marginBottom: 16 }}>
        <div style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase', marginBottom: 8 }}>
          Current DaliDesigner State
        </div>
        <Row label="Devices" value={String(deviceCount)} highlight={deviceCount > 0} />
        <Row label="Lines" value={String(lineCount)} highlight={lineCount > 0} />
        <Row label="Groups" value={String(groupCount)} />
        <Row label="Scenes" value={String(sceneCount)} />
      </div>

      {!hasDesign && (
        <div style={{ padding: 10, background: '#3F1D1D', border: '1px solid #F87171', borderRadius: 4, color: '#F87171', fontSize: 11, marginBottom: 16 }}>
          ⚠ No devices found in the current DALI design. Please open a DALI document in DaliDesigner first.
        </div>
      )}

      <Footer
        onCancel={onClose}
        onConfirm={onConfirm}
        confirmLabel="Load Design"
        confirmDisabled={!hasDesign}
      />
    </Modal>
  );
};

const Row: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{ color: highlight ? '#4ADE80' : '#E5E7EB', fontFamily: 'monospace', fontWeight: 'bold' }}>{value}</span>
  </div>
);

// ── Shared Modal Primitives ──────────────────────────────────────

export const Modal: React.FC<{ onClose: () => void; title: string; children: React.ReactNode }> = ({ onClose, title, children }) => (
  <div
    onClick={onClose}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{ background: '#0F1424', border: '1px solid #334155', borderRadius: 8, width: 480, maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
    >
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
    <button
      onClick={onConfirm}
      disabled={confirmDisabled}
      style={{
        ...btnStyle,
        background: confirmDisabled ? '#1F2937' : danger ? '#991B1B' : '#1D4ED8',
        color: confirmDisabled ? '#64748B' : '#FFF',
        cursor: confirmDisabled ? 'not-allowed' : 'pointer',
        fontWeight: 'bold',
      }}
    >
      {confirmLabel}
    </button>
  </div>
);

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
      {label}
    </div>
    {children}
  </div>
);

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  background: '#1E293B',
  color: '#E5E7EB',
  border: '1px solid #334155',
  borderRadius: 4,
  fontSize: 11,
  cursor: 'pointer',
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  background: '#0A0F1E',
  color: '#E5E7EB',
  border: '1px solid #334155',
  borderRadius: 4,
  fontSize: 12,
  fontFamily: 'monospace',
  boxSizing: 'border-box',
};

export const errorStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: '#3F1D1D',
  border: '1px solid #F87171',
  borderRadius: 4,
  color: '#F87171',
  fontSize: 11,
  marginBottom: 8,
};