// src/modules/DaliProgrammingStudio/Workspace/ProgrammingNavigation.tsx

import React from 'react';

export type WorkspaceView = 'dashboard' | 'network' | 'design' | 'jobs' | 'verification';

interface ProgrammingNavigationProps {
  activeView: WorkspaceView;
  onChange: (view: WorkspaceView) => void;
}

const VIEWS: { id: WorkspaceView; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'network', label: 'Network' },
  { id: 'design', label: 'Design' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'verification', label: 'Verification' },
];

export const ProgrammingNavigation: React.FC<ProgrammingNavigationProps> = ({ activeView, onChange }) => {
  return (
    <nav
      style={{
        display: 'flex',
        gap: 2,
        padding: '0 16px',
        height: 36,
        background: '#0A0F1E',
        borderBottom: '1px solid #1F2937',
      }}
    >
      {VIEWS.map(view => (
        <button
          key={view.id}
          onClick={() => onChange(view.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeView === view.id ? '#38BDF8' : '#94A3B8',
            padding: '0 12px',
            fontSize: 12,
            fontWeight: activeView === view.id ? 'bold' : 'normal',
            borderBottom: activeView === view.id ? '2px solid #38BDF8' : '2px solid transparent',
            cursor: 'pointer',
            height: '100%',
          }}
        >
          {view.label}
        </button>
      ))}
    </nav>
  );
};