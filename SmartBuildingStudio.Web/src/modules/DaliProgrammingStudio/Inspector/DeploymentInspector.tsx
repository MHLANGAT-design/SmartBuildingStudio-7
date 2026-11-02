// src/modules/DaliProgrammingStudio/Inspector/DeploymentInspector.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectDeploymentResult, 
  selectDeploymentProgress 
} from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

interface Props {
  deploymentId: string;
}

export const DeploymentInspector: React.FC<Props> = ({ deploymentId }) => {
  const result = useAppSelector(selectDeploymentResult);
  const progress = useAppSelector(selectDeploymentProgress);

  if (!result && !progress) {
    return <div style={{ color: '#64748B', fontSize: 11 }}>No deployment data</div>;
  }

  return (
    <div>
      <div style={titleStyle}>Deployment</div>
      <div style={subtitleStyle}>{deploymentId}</div>

      {progress && (
        <Section title="Progress">
          <Row label="Total" value={String(progress.totalSequences)} mono />
          <Row label="Completed" value={String(progress.completedSequences)} />
          <Row label="Failed" value={String(progress.failedSequences)} />
          <Row label="Percentage" value={`${progress.percentage}%`} />
        </Section>
      )}

      {result && (
        <Section title="Result">
          <Row label="Success" value={result.success ? 'Yes' : 'No'} />
          <Row label="Partial" value={result.partial ? 'Yes' : 'No'} />
          <Row label="Successful Sequences" value={String(result.successfulSequences.length)} />
          <Row label="Failed Sequences" value={String(result.failedSequences.length)} />
          <Row label="Started" value={new Date(result.startedAt).toLocaleString()} />
          <Row label="Completed" value={new Date(result.completedAt).toLocaleString()} />
          {result.errorMessage && (
            <div style={{ marginTop: 6, padding: 6, background: '#3F1D1D', border: '1px solid #F87171', borderRadius: 3, color: '#F87171', fontSize: 10 }}>
              {result.errorMessage}
            </div>
          )}
        </Section>
      )}
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ color: '#38BDF8', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
      {title}
    </div>
    {children}
  </div>
);

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{ color: '#E5E7EB', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
  </div>
);

const titleStyle: React.CSSProperties = { color: '#E5E7EB', fontSize: 13, fontWeight: 'bold', marginBottom: 2 };
const subtitleStyle: React.CSSProperties = { color: '#64748B', fontSize: 10, marginBottom: 12, fontFamily: 'monospace' };