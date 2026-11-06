// src/modules/DeviceDiscovery/Components/ProjectSelector/DrawingSelector.tsx

import React from 'react';

export interface DrawingOption {
  drawingDocumentId: string;
  name: string;
}

interface Props {
  drawings: DrawingOption[];
  selectedDrawingId: string | null;
  onSelect: (drawingId: string) => void;
  disabled?: boolean;
}

export const DrawingSelector: React.FC<Props> = ({
  drawings,
  selectedDrawingId,
  onSelect,
  disabled,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>
      Drawing
    </label>
    <select
      value={selectedDrawingId ?? ''}
      onChange={e => onSelect(e.target.value)}
      disabled={disabled || drawings.length === 0}
      style={{
        padding: '6px 8px',
        background: '#1E293B',
        color: drawings.length === 0 ? '#64748B' : '#E5E7EB',
        border: '1px solid #1F2937',
        borderRadius: 4,
        fontSize: 12,
        cursor: disabled || drawings.length === 0 ? 'not-allowed' : 'pointer',
      }}
    >
      <option value="">{drawings.length === 0 ? 'No drawings' : 'Select drawing…'}</option>
      {drawings.map(d => (
        <option key={d.drawingDocumentId} value={d.drawingDocumentId}>
          {d.name}
        </option>
      ))}
    </select>
  </div>
);