// src/modules/DaliProgrammingStudio/Workspace/CompilationErrorsPanel.tsx

import React from 'react';
import type { CompilationError } from '@/modules/DaliProgrammingStudio/Compiler/CompilationResult';

interface Props {
  errors: CompilationError[];
  warnings: string[];
  onClose: () => void;
}

export const CompilationErrorsPanel: React.FC<Props> = ({ errors, warnings, onClose }) => {
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  if (!hasErrors && !hasWarnings) return null;

  return (
    <div
      style={{
        position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
        width: '800px', maxWidth: '90vw', maxHeight: '50vh',
        backgroundColor: '#0A0F1E', border: `1px solid ${hasErrors ? '#F87171' : '#FBBF24'}`,
        borderRadius: 8, boxShadow: '0 24px 48px rgba(0,0,0,0.9)',
        display: 'flex', flexDirection: 'column', zIndex: 99999,
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <div
        style={{
          padding: '12px 16px', backgroundColor: hasErrors ? '#1F1313' : '#1F1A13',
          borderBottom: `1px solid ${hasErrors ? 'rgba(248, 113, 113, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTopLeftRadius: 8, borderTopRightRadius: 8,
        }}
      >
        <div style={{ color: hasErrors ? '#F87171' : '#FBBF24', fontWeight: 'bold', fontSize: 13 }}>
          {hasErrors ? `Compilation Failed (${errors.length} issues)` : `Compilation Warnings (${warnings.length})`}
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 20 }}>×</button>
      </div>

      <div style={{ padding: 16, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11, color: '#E5E7EB' }}>
        {errors.map((err, i) => (
          <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #1F2937' }}>
            <div style={{ color: '#F87171', fontWeight: 'bold', marginBottom: 2 }}>[{err.code}]</div>
            <div style={{ lineHeight: 1.4 }}>{err.message}</div>
          </div>
        ))}
        {warnings.map((warn, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ color: '#FBBF24', fontWeight: 'bold' }}>[WARNING]</div>
            <div>{warn}</div>
          </div>
        ))}
      </div>
    </div>
  );
};