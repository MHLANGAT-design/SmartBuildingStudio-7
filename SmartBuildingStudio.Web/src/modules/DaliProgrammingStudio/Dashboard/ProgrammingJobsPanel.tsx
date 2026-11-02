// src/modules/DaliProgrammingStudio/Dashboard/ProgrammingJobsPanel.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectCurrentDocument } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const ProgrammingJobsPanel: React.FC = () => {
  const doc = useAppSelector(selectCurrentDocument);

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>Active Job</div>
      {doc ? (
        <div style={{ fontSize: 11, lineHeight: 1.7 }}>
          <Row label="Job ID" value={doc.documentId} />
          <Row label="Name" value={doc.jobName} />
          <Row label="State" value={doc.state} />
          <Row label="Created" value={new Date(doc.createdAt).toLocaleString()} />
          <Row label="Updated" value={new Date(doc.updatedAt).toLocaleString()} />
        </div>
      ) : (
        <div style={{ color: '#64748B', fontSize: 11 }}>No active job</div>
      )}
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
    <span style={{ color: '#94A3B8' }}>{label}</span>
    <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{value}</span>
  </div>
);

const cardStyle: React.CSSProperties = {
  background: '#0F1424',
  border: '1px solid #1F2937',
  borderRadius: 6,
  padding: 16,
  marginBottom: 12,
};

const cardTitleStyle: React.CSSProperties = {
  color: '#38BDF8',
  fontSize: 11,
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 12,
};