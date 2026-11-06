// src/modules/DeviceDiscovery/Components/DaliLineSelector/DaliLineSelector.tsx

import React from 'react';
import type { DaliLineSummary } from '@/modules/DeviceDiscovery/Components/DaliLineSelector/DaliLineCard';

interface Props {
  lines: DaliLineSummary[];
  selectedLineId: string | null;
  onSelect: (lineId: string) => void;
  disabled: boolean;
}

export const DaliLineSelector: React.FC<Props> = ({
  lines,
  selectedLineId,
  onSelect,
  disabled,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>
      Select DALI Line
    </div>

    {lines.length === 0 ? (
      <div style={{ color: '#64748B', fontSize: 11 }}>No lines found in design.</div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {lines.map(line => (
          <button
            key={line.lineId}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(line.lineId)}
            style={{
              padding: '6px 8px',
              background: selectedLineId === line.lineId ? '#1D4ED8' : '#0F1424',
              border: `1px solid ${selectedLineId === line.lineId ? '#38BDF8' : '#1F2937'}`,
              borderRadius: 4,
              color: selectedLineId === line.lineId ? '#FFF' : '#E5E7EB',
              textAlign: 'left',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: 11,
              fontWeight: selectedLineId === line.lineId ? 'bold' : 'normal',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {line.name}
            <div style={{ fontSize: 9, color: selectedLineId === line.lineId ? '#BAE6FD' : '#64748B', fontFamily: 'monospace', marginTop: 2 }}>
              ID: {line.lineId}
            </div>
          </button>
        ))}
      </div>
    )}
  </div>
);

export default DaliLineSelector;