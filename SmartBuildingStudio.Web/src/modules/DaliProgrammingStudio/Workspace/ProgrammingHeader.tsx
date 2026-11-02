// src/modules/DaliProgrammingStudio/Workspace/ProgrammingHeader.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectCurrentDocument, selectJobState } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const ProgrammingHeader: React.FC = () => {
  const doc = useAppSelector(selectCurrentDocument);
  const jobState = useAppSelector(selectJobState);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: 48,
        borderBottom: '1px solid #1F2937',
        background: '#0F1424',
        color: '#E5E7EB',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 'bold', color: '#38BDF8' }}>DALI Programming</span>
        {doc && (
          <>
            <span style={{ color: '#64748B' }}>|</span>
            <span>{doc.jobName}</span>
          </>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            padding: '2px 10px',
            borderRadius: 12,
            background: getStateColor(jobState),
            color: '#0F1424',
            fontWeight: 'bold',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {jobState}
        </span>
      </div>
    </header>
  );
};

function getStateColor(state: string): string {
  switch (state) {
    case 'Draft': return '#94A3B8';
    case 'DesignLoaded': return '#60A5FA';
    case 'Compiling': return '#FBBF24';
    case 'Compiled': return '#34D399';
    case 'Validated': return '#4ADE80';
    case 'Approved': return '#22C55E';
    case 'Deploying': return '#F59E0B';
    case 'Completed': return '#10B981';
    case 'Failed': return '#EF4444';
    case 'Cancelled': return '#6B7280';
    default: return '#94A3B8';
  }
}