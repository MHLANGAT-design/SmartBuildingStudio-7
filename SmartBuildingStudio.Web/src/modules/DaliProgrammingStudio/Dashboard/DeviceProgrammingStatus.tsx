// src/modules/DaliProgrammingStudio/Dashboard/DeviceProgrammingStatus.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { 
  selectApprovedDesign,
  selectDeploymentResult,
  selectVerificationReport,
} from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const DeviceProgrammingStatus: React.FC = () => {
  const design = useAppSelector(selectApprovedDesign);
  const result = useAppSelector(selectDeploymentResult);
  const verification = useAppSelector(selectVerificationReport);

  const total = design?.devices.length ?? 0;
  const programmed = result?.successfulSequences.length ?? 0;
  const failed = result?.failedSequences.length ?? 0;
  const verified = verification?.summary.matchingDevices ?? 0;

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>Device Status</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Bar label="Total" value={total} max={total || 1} color="#38BDF8" />
        <Bar label="Programmed" value={programmed} max={total || 1} color="#4ADE80" />
        <Bar label="Verified" value={verified} max={total || 1} color="#22C55E" />
        <Bar label="Failed" value={failed} max={total || 1} color="#F87171" />
      </div>
    </div>
  );
};

const Bar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: '#94A3B8' }}>{label}</span>
        <span style={{ color, fontWeight: 'bold', fontFamily: 'monospace' }}>{value}</span>
      </div>
      <div style={{ height: 4, background: '#1F2937', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
};

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