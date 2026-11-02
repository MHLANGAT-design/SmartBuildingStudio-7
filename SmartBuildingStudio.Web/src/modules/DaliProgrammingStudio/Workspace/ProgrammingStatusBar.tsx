// src/modules/DaliProgrammingStudio/Workspace/ProgrammingStatusBar.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectJobState, selectError, selectWarnings } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const ProgrammingStatusBar: React.FC = () => {
  const jobState = useAppSelector(selectJobState);
  const error = useAppSelector(selectError);
  const warnings = useAppSelector(selectWarnings);

  return (
    <footer
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: 24,
        borderTop: '1px solid #1F2937',
        background: '#0A0F1E',
        color: '#94A3B8',
        fontFamily: 'monospace',
        fontSize: 11,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', gap: 16 }}>
        <span>Job: {jobState}</span>
        {warnings.length > 0 && (
          <span style={{ color: '#FBBF24' }}>
            ⚠ {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div style={{ color: error ? '#F87171' : '#4ADE80' }}>
        {error ? 'Error: Compilation Failed (See Error Panel)' : 'Ready'}
      </div>
    </footer>
  );
};