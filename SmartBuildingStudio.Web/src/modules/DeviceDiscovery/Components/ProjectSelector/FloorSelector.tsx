// src/modules/DeviceDiscovery/Components/ProjectSelector/FloorSelector.tsx

import React from 'react';

export interface FloorOption {
  floorId: string;
  name: string;
}

interface Props {
  floors: FloorOption[];
  selectedFloorId: string | null;
  onSelect: (floorId: string) => void;
  disabled?: boolean;
}

export const FloorSelector: React.FC<Props> = ({
  floors,
  selectedFloorId,
  onSelect,
  disabled,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>
      Floor
    </label>
    <select
      value={selectedFloorId ?? ''}
      onChange={e => onSelect(e.target.value)}
      disabled={disabled || floors.length === 0}
      style={{
        padding: '6px 8px',
        background: '#1E293B',
        color: floors.length === 0 ? '#64748B' : '#E5E7EB',
        border: '1px solid #1F2937',
        borderRadius: 4,
        fontSize: 12,
        cursor: disabled || floors.length === 0 ? 'not-allowed' : 'pointer',
      }}
    >
      <option value="">{floors.length === 0 ? 'No floors' : 'Select floor…'}</option>
      {floors.map(f => (
        <option key={f.floorId} value={f.floorId}>
          {f.name}
        </option>
      ))}
    </select>
  </div>
);