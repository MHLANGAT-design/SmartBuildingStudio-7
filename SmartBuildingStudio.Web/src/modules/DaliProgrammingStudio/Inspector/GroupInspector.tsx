// src/modules/DaliProgrammingStudio/Inspector/GroupInspector.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

interface Props {
  groupId: number;
}

export const GroupInspector: React.FC<Props> = ({ groupId }) => {
  const design = useAppSelector(selectApprovedDesign);
  const group = design?.groups.find(g => g.groupId === groupId);
  const members = design?.devices.filter(d => d.groups.some(g => g.groupId === groupId)) || [];

  if (!group) {
    return <div style={{ color: '#64748B', fontSize: 11 }}>Group not found</div>;
  }

  return (
    <div>
      <div style={titleStyle}>{group.name}</div>
      <div style={subtitleStyle}>Group ID: {group.groupId}</div>

      <Section title="Members">
        {members.length === 0 ? (
          <div style={{ color: '#64748B', fontSize: 11 }}>No members</div>
        ) : (
          members.map(m => (
            <div
              key={m.deviceId}
              style={{
                padding: '4px 8px',
                background: '#0F1424',
                border: '1px solid #1F2937',
                borderRadius: 3,
                marginBottom: 3,
                fontSize: 10,
                color: '#E5E7EB',
              }}
            >
              {m.logicalName}
              <span style={{ color: '#64748B', marginLeft: 6, fontFamily: 'monospace' }}>
                @{m.hardwareAddress}
              </span>
            </div>
          ))
        )}
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

const titleStyle: React.CSSProperties = { color: '#E5E7EB', fontSize: 13, fontWeight: 'bold', marginBottom: 2 };
const subtitleStyle: React.CSSProperties = { color: '#64748B', fontSize: 10, marginBottom: 12, fontFamily: 'monospace' };