// src/modules/DaliProgrammingStudio/Workspace/ProgrammingSummary.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectProgrammingPlan, selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const ProgrammingSummary: React.FC = () => {
  const plan = useAppSelector(selectProgrammingPlan);
  const design = useAppSelector(selectApprovedDesign);

  return (
    <div
      style={{
        padding: 12,
        background: '#0F1424',
        border: '1px solid #1F2937',
        borderRadius: 6,
        color: '#E5E7EB',
        fontFamily: 'monospace',
        fontSize: 11,
        lineHeight: 1.6,
      }}
    >
      <div style={{ color: '#38BDF8', fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Summary
      </div>
      {design ? (
        <>
          <Row label="Devices" value={design.devices.length} />
          <Row label="Lines" value={design.topology.lines.length} />
          <Row label="Gateways" value={design.topology.gateways.length} />
        </>
      ) : (
        <div style={{ color: '#64748B' }}>No design loaded</div>
      )}
      {plan && (
        <>
          <div style={{ height: 1, background: '#1F2937', margin: '8px 0' }} />
          <Row label="Sequences" value={plan.sequences.length} />
          <Row label="Commands" value={plan.totalCommands} />
        </>
      )}
    </div>
  );
};

const Row: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ color: '#94A3B8' }}>{label}</span>
    <span style={{ fontWeight: 'bold' }}>{value}</span>
  </div>
);