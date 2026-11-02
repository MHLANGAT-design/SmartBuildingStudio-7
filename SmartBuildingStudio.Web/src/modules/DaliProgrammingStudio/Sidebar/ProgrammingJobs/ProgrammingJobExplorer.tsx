// src/modules/DaliProgrammingStudio/Sidebar/ProgrammingJobs/ProgrammingJobExplorer.tsx

import React, { useState } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectCurrentDocument } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
import { JobDetailsPanel } from '@/modules/DaliProgrammingStudio/Sidebar/ProgrammingJobs/JobDetailsPanel';

export const ProgrammingJobExplorer: React.FC = () => {
  const doc = useAppSelector(selectCurrentDocument);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>(doc?.documentId);

  if (!doc) {
    return <div style={{ color: '#64748B', fontSize: 11, padding: 8 }}>No active jobs</div>;
  }

  return (
    <div>
      <div
        onClick={() => setSelectedJobId(doc.documentId)}
        style={{
          padding: '6px 8px',
          background: selectedJobId === doc.documentId ? '#0F2B4C' : '#0F1424',
          border: `1px solid ${selectedJobId === doc.documentId ? '#38BDF8' : '#1F2937'}`,
          borderRadius: 4,
          marginBottom: 8,
          cursor: 'pointer',
          fontSize: 11,
        }}
      >
        <div style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{doc.jobName}</div>
        <div style={{ color: '#64748B', fontSize: 10, marginTop: 2, fontFamily: 'monospace' }}>
          {doc.state} · {new Date(doc.updatedAt).toLocaleDateString()}
        </div>
      </div>
      {selectedJobId === doc.documentId && <JobDetailsPanel />}
    </div>
  );
};