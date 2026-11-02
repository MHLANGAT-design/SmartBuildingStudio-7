// src/modules/DaliProgrammingStudio/Network/GroupMembershipView.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const GroupMembershipView: React.FC = () => {
  const design = useAppSelector(selectApprovedDesign);

  if (!design || design.groups.length === 0) {
    return <div style={{ color: '#64748B', fontSize: 11, padding: 12 }}>No groups defined</div>;
  }

  return (
    <div>
      {design.groups.map(group => {
        const members = design.devices.filter(d => d.groups.some(g => g.groupId === group.groupId));
        return (
          <div
            key={group.groupId}
            style={{
              padding: 10,
              background: '#0F1424',
              border: '1px solid #1F2937',
              borderRadius: 4,
              marginBottom: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 'bold', color: '#E5E7EB' }}>{group.name}</span>
              <span style={{ fontSize: 10, color: '#64748B', fontFamily: 'monospace' }}>
                Group {group.groupId} · {members.length} devices
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {members.slice(0, 8).map(m => (
                <span
                  key={m.deviceId}
                  style={{
                    padding: '1px 6px',
                    background: '#1E293B',
                    borderRadius: 3,
                    fontSize: 9,
                    color: '#94A3B8',
                    fontFamily: 'monospace',
                  }}
                >
                  {m.logicalName}
                </span>
              ))}
              {members.length > 8 && (
                <span style={{ fontSize: 9, color: '#64748B' }}>+{members.length - 8} more</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};