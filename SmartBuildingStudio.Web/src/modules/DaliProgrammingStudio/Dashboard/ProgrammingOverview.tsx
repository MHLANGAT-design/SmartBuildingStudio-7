// src/modules/DaliProgrammingStudio/Dashboard/ProgrammingOverview.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectApprovedDesign, 
  selectProgrammingPlan, 
  selectJobState 
} from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const ProgrammingOverview: React.FC = () => {
  const design = useAppSelector(selectApprovedDesign);
  const plan = useAppSelector(selectProgrammingPlan);
  const jobState = useAppSelector(selectJobState);

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>Overview</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <Stat label="Job State" value={jobState} highlight />
        <Stat label="Design Rev" value={design?.revisionId.slice(-8) || '—'} />
        <Stat label="Devices" value={design?.devices.length ?? '—'} />
        <Stat label="Commands" value={plan?.totalCommands ?? '—'} />
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string | number; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div>
    <div style={{ color: '#64748B', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ color: highlight ? '#38BDF8' : '#E5E7EB', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' }}>
      {value}
    </div>
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