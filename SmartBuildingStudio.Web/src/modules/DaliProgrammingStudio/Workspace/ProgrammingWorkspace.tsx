// src/modules/DaliProgrammingStudio/Workspace/ProgrammingWorkspace.tsx

import React from 'react';
import { ProgrammingHeader } from '@/modules/DaliProgrammingStudio/Workspace/ProgrammingHeader';
import { ProgrammingNavigation, type WorkspaceView } from '@/modules/DaliProgrammingStudio/Workspace/ProgrammingNavigation';
import { ProgrammingStatusBar } from '@/modules/DaliProgrammingStudio/Workspace/ProgrammingStatusBar';
import { ProgrammingSummary } from '@/modules/DaliProgrammingStudio/Workspace/ProgrammingSummary';

interface ProgrammingWorkspaceProps {
  activeView: WorkspaceView;
  onChangeView: (view: WorkspaceView) => void;
  children?: React.ReactNode;
}

export const ProgrammingWorkspace: React.FC<ProgrammingWorkspaceProps> = ({ 
  activeView, 
  onChangeView, 
  children 
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#0a0a0a',
        color: '#E5E7EB',
      }}
    >
      <ProgrammingHeader />
      <ProgrammingNavigation activeView={activeView} onChange={onChangeView} />
      
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <main
          style={{
            flex: 1,
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {children || <div style={{ color: '#64748B', padding: 16 }}>Select a view to begin.</div>}
        </main>
        
        <aside
          style={{
            width: 220,
            padding: 12,
            borderLeft: '1px solid #1F2937',
            background: '#0A0F1E',
            overflow: 'auto',
          }}
        >
          <ProgrammingSummary />
        </aside>
      </div>
      <ProgrammingStatusBar />
    </div>
  );
};