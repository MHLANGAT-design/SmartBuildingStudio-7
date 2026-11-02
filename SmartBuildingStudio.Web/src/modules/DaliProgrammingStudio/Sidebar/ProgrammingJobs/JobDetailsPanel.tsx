// src/modules/DaliProgrammingStudio/Sidebar/ProgrammingJobs/JobDetailsPanel.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectCurrentDocument } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const JobDetailsPanel: React.FC = () => {
  const doc = useAppSelector(selectCurrentDocument);
  if (!doc) return null;

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
      <Row label="Job ID" value={doc.documentId} />
      <Row label="State" value={doc.state} />
      <Row label="Revision" value={doc.revisionId} />
      <Row label="Created" value={new Date(doc.createdAt).toLocaleString()} />
      <Row label="Updated" value={new Date(doc.updatedAt).toLocaleString()} />
      {doc.programmingPlan && (
        <>
          <div style={{ height: 1, background: '#1F2937', margin: '4px 0' }} />
          <Row label="Sequences" value={String(doc.programmingPlan.sequences.length)} />
          <Row label="Commands" value={String(doc.programmingPlan.totalCommands)} />
        </>
      )}
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{ color: '#E5E7EB', fontFamily: 'monospace' }}>{value}</span>
  </div>
);