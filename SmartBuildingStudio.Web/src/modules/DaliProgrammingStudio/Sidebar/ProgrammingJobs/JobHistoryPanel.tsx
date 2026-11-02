// src/modules/DaliProgrammingStudio/Sidebar/ProgrammingJobs/JobHistoryPanel.tsx

import React from 'react';
import type { HistoryEntry } from '@/modules/DaliProgrammingStudio/Document/ProgrammingHistory';

interface Props {
  entries: HistoryEntry[];
}

export const JobHistoryPanel: React.FC<Props> = ({ entries }) => {
  return (
    <div
      style={{
        padding: 8,
        background: '#0F1424',
        border: '1px solid #1F2937',
        borderRadius: 4,
        fontSize: 10,
      }}
    >
      <div style={{ color: '#38BDF8', fontWeight: 'bold', marginBottom: 6 }}>History</div>
      {entries.length === 0 ? (
        <div style={{ color: '#64748B' }}>No history</div>
      ) : (
        entries.slice(-5).reverse().map(entry => (
          <div key={entry.entryId} style={{ marginBottom: 4 }}>
            <div style={{ color: '#E5E7EB' }}>{entry.action}</div>
            <div style={{ color: '#64748B', fontSize: 9 }}>
              {new Date(entry.timestamp).toLocaleString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
};