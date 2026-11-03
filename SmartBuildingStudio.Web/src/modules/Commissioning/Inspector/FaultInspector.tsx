// src/modules/Commissioning/Inspector/FaultInspector.tsx

import React from 'react';
import type { Fault } from '@/modules/Commissioning/models/Fault';

interface Props {
  fault: Fault;
  onResolve?: () => void;
}

export const FaultInspector: React.FC<Props> = ({ fault, onResolve }) => {
  return (
    <div style={{ fontSize: 11 }}>
      <div style={{ color: '#F87171', fontWeight: 'bold', marginBottom: 8 }}>{fault.category}</div>
      <div style={{ color: '#E5E7EB', marginBottom: 12 }}>{fault.description}</div>
      
      <Row label="Severity" value={fault.severity} />
      <Row label="Target" value={fault.targetId} />
      <Row label="Detected" value={new Date(fault.detectedAt).toLocaleTimeString()} />
      
      {onResolve && !fault.isResolved && (
        <button 
          onClick={onResolve}
          style={{ marginTop: 12, width: '100%', padding: '6px', background: '#1D4ED8', color: '#FFF', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
        >
          Resolve Fault
        </button>
      )}
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{ color: '#E5E7EB', fontFamily: 'monospace' }}>{value}</span>
  </div>
);