// src/modules/DaliProgrammingStudio/Sidebar/DesignExplorer/DeviceExplorer.tsx

import React, { useState } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const DeviceExplorer: React.FC = () => {
  const design = useAppSelector(selectApprovedDesign);
  const [filter, setFilter] = useState('');

  if (!design) return <div style={{ color: '#64748B', fontSize: 11, padding: 8 }}>No design loaded</div>;

  const filtered = design.devices.filter(d =>
    d.logicalName.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Filter devices..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{
          width: '100%',
          padding: '4px 8px',
          background: '#0F1424',
          color: '#E5E7EB',
          border: '1px solid #1F2937',
          borderRadius: 4,
          fontSize: 11,
          marginBottom: 8,
        }}
      />
      {filtered.map(device => (
        <div
          key={device.deviceId}
          style={{
            padding: '6px 8px',
            background: '#0F1424',
            border: '1px solid #1F2937',
            borderRadius: 4,
            marginBottom: 4,
            fontSize: 11,
          }}
        >
          <div style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{device.logicalName}</div>
          <div style={{ color: '#64748B', fontSize: 10, marginTop: 2, fontFamily: 'monospace' }}>
            Addr {device.hardwareAddress} · {device.role}
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <div style={{ color: '#64748B', fontSize: 11, padding: 8 }}>No matching devices</div>
      )}
    </div>
  );
};