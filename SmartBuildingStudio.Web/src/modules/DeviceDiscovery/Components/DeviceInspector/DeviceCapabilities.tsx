// src/modules/DeviceDiscovery/Components/DeviceInspector/DeviceCapabilities.tsx

import React from 'react';

interface Props {
  capabilities: string[];
}

export const DeviceCapabilities: React.FC<Props> = ({ capabilities }) => (
  <div>
    <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>Capabilities</div>
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {capabilities.length === 0 ? (
        <span style={{ fontSize: 11, color: '#64748B' }}>None reported</span>
      ) : (
        capabilities.map(cap => (
          <span key={cap} style={{
            padding: '2px 6px',
            background: '#1E293B',
            borderRadius: 4,
            fontSize: 10,
            color: '#38BDF8',
          }}>
            {cap}
          </span>
        ))
      )}
    </div>
  </div>
);