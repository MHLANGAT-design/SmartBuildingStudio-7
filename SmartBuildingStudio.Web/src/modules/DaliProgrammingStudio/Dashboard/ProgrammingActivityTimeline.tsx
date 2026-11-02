// src/modules/DaliProgrammingStudio/Dashboard/ProgrammingActivityTimeline.tsx

import React from 'react';
import type { HistoryEntry } from '@/modules/DaliProgrammingStudio/Document/ProgrammingHistory';

interface Props {
  entries: HistoryEntry[];
}

export const ProgrammingActivityTimeline: React.FC<Props> = ({ entries }) => {
  const recent = [...entries].reverse().slice(0, 8);

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>Recent Activity</div>
      {recent.length === 0 && (
        <div style={{ color: '#64748B', fontSize: 11 }}>No activity yet</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {recent.map(entry => (
          <div key={entry.entryId} style={{ display: 'flex', gap: 8, fontSize: 11 }}>
            <div style={{ color: '#64748B', fontFamily: 'monospace', fontSize: 10, minWidth: 60 }}>
              {new Date(entry.timestamp).toLocaleTimeString()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{entry.action}</div>
              {entry.details && <div style={{ color: '#94A3B8', fontSize: 10 }}>{entry.details}</div>}
            </div>
          </div>
        ))}
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