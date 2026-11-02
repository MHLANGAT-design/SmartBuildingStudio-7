// src/modules/DaliProgrammingStudio/Sidebar/DesignExplorer/DaliLineExplorer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const DaliLineExplorer: React.FC = () => {
  const design = useAppSelector(selectApprovedDesign);

  if (!design) return <EmptyState />;

  return (
    <div>
      {design.topology.lines.map(line => (
        <div
          key={line.lineId}
          style={{
            padding: '6px 8px',
            background: '#0F1424',
            border: '1px solid #1F2937',
            borderRadius: 4,
            marginBottom: 4,
            fontSize: 11,
          }}
        >
          <div style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{line.name}</div>
          <div style={{ color: '#64748B', fontSize: 10, marginTop: 2, fontFamily: 'monospace' }}>
            {line.deviceCount} / {line.maxDevices} devices
          </div>
        </div>
      ))}
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div style={{ color: '#64748B', fontSize: 11, padding: 8 }}>No design loaded</div>
);