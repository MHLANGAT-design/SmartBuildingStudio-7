// src/modules/DaliProgrammingStudio/Sidebar/DesignExplorer/GroupExplorer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const GroupExplorer: React.FC = () => {
  const design = useAppSelector(selectApprovedDesign);

  if (!design) return <div style={{ color: '#64748B', fontSize: 11, padding: 8 }}>No design loaded</div>;

  if (design.groups.length === 0) {
    return <div style={{ color: '#64748B', fontSize: 11, padding: 8 }}>No groups defined</div>;
  }

  return (
    <div>
      {design.groups.map(group => (
        <div
          key={group.groupId}
          style={{
            padding: '6px 8px',
            background: '#0F1424',
            border: '1px solid #1F2937',
            borderRadius: 4,
            marginBottom: 4,
            fontSize: 11,
          }}
        >
          <div style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{group.name}</div>
          <div style={{ color: '#64748B', fontSize: 10, marginTop: 2, fontFamily: 'monospace' }}>
            Group ID: {group.groupId}
          </div>
        </div>
      ))}
    </div>
  );
};