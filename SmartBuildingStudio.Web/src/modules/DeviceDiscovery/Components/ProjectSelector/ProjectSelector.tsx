// src/modules/DeviceDiscovery/Components/ProjectSelector/ProjectSelector.tsx

import React from 'react';

export interface FloorOption { floorId: string; name: string; }
export interface DrawingOption { drawingDocumentId: string; name: string; }

interface Props {
  projectName: string | null;
  floors: FloorOption[];
  drawings: DrawingOption[];
  selectedFloorId: string | null;
  selectedDrawingId: string | null;
  onFloorSelect: (floorId: string) => void;
  onDrawingSelect: (drawingId: string) => void;
  disabled?: boolean;
}

export const ProjectSelector: React.FC<Props> = ({
  projectName,
  floors,
  drawings,
  selectedFloorId,
  selectedDrawingId,
  onFloorSelect,
  onDrawingSelect,
  disabled,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>
      Project
    </div>
    <div style={{ fontSize: 13, color: '#E5E7EB', fontWeight: 'bold', marginBottom: 4 }}>
      {projectName ?? 'Loading...'}
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <label style={{ fontSize: 10, color: '#64748B' }}>Floor</label>
      <select
        value={selectedFloorId ?? ''}
        onChange={e => onFloorSelect(e.target.value)}
        disabled={disabled || floors.length === 0}
        style={{
          padding: '4px 6px',
          background: '#1E293B',
          color: floors.length === 0 ? '#64748B' : '#E5E7EB',
          border: '1px solid #1F2937',
          borderRadius: 4,
          fontSize: 11,
          cursor: disabled || floors.length === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        <option value="">{floors.length === 0 ? 'No floors' : 'Select floor…'}</option>
        {floors.map(f => (
          <option key={f.floorId} value={f.floorId}>{f.name}</option>
        ))}
      </select>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <label style={{ fontSize: 10, color: '#64748B' }}>Drawing</label>
      <select
        value={selectedDrawingId ?? ''}
        onChange={e => onDrawingSelect(e.target.value)}
        disabled={disabled || drawings.length === 0}
        style={{
          padding: '4px 6px',
          background: '#1E293B',
          color: drawings.length === 0 ? '#64748B' : '#E5E7EB',
          border: '1px solid #1F2937',
          borderRadius: 4,
          fontSize: 11,
          cursor: disabled || drawings.length === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        <option value="">{drawings.length === 0 ? 'No drawings' : 'Select drawing…'}</option>
        {drawings.map(d => (
          <option key={d.drawingDocumentId} value={d.drawingDocumentId}>{d.name}</option>
        ))}
      </select>
    </div>
  </div>
);