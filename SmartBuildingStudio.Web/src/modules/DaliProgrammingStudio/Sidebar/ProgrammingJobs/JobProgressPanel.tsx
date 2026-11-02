// src/modules/DaliProgrammingStudio/Sidebar/ProgrammingJobs/JobProgressPanel.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectDeploymentProgress, 
  selectIsDeploying 
} from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const JobProgressPanel: React.FC = () => {
  const progress = useAppSelector(selectDeploymentProgress);
  const isDeploying = useAppSelector(selectIsDeploying);

  if (!progress && !isDeploying) return null;

  const pct = progress?.percentage ?? 0;

  return (
    <div
      style={{
        padding: 8,
        background: '#0F1424',
        border: '1px solid #1F2937',
        borderRadius: 4,
        fontSize: 10,
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: isDeploying ? '#FBBF24' : '#4ADE80', fontWeight: 'bold' }}>
          {isDeploying ? 'Deploying...' : 'Complete'}
        </span>
        <span style={{ color: '#E5E7EB', fontFamily: 'monospace' }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: '#1F2937', borderRadius: 2, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: isDeploying ? '#FBBF24' : '#4ADE80',
            transition: 'width 0.3s',
          }}
        />
      </div>
      {progress && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, color: '#64748B' }}>
          <span>✓ {progress.completedSequences}</span>
          <span>✗ {progress.failedSequences}</span>
          <span>{progress.totalSequences} total</span>
        </div>
      )}
    </div>
  );
};