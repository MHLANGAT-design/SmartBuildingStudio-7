// src/modules/DaliProgrammingStudio/Inspector/CommandInspector.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectProgrammingPlan } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

interface Props {
  commandId: string;
}

export const CommandInspector: React.FC<Props> = ({ commandId }) => {
  const plan = useAppSelector(selectProgrammingPlan);
  
  let command = null;
  let sequenceId = '';
  if (plan) {
    for (const seq of plan.sequences) {
      const c = seq.commands.find(cmd => cmd.id === commandId);
      if (c) {
        command = c;
        sequenceId = seq.id;
        break;
      }
    }
  }

  if (!command) {
    return <div style={{ color: '#64748B', fontSize: 11 }}>Command not found</div>;
  }

  return (
    <div>
      <div style={titleStyle}>Command</div>
      <div style={subtitleStyle}>{command.description}</div>

      <Section title="Technical">
        <Row label="Command ID" value={command.id} mono />
        <Row label="Sequence" value={sequenceId} mono />
        <Row label="Category" value={command.category} />
        <Row label="Target Type" value={command.targetType} />
        <Row label="Target Address" value={String(command.targetAddress)} mono />
        <Row label="Opcode" value={`0x${command.opcode.toString(16).toUpperCase().padStart(2, '0')}`} mono />
        <Row label="Data" value={command.data !== undefined ? `0x${command.data.toString(16).toUpperCase().padStart(2, '0')}` : '—'} mono />
      </Section>
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