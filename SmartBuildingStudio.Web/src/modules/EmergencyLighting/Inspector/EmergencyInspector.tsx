// src/modules/EmergencyLighting/Inspector/EmergencyInspector.tsx

import React from 'react';

export const EmergencyInspector: React.FC = () => {
  return (
    <div style={{ width: '320px', background: '#0F1424', borderLeft: '1px solid #1E293B', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #1E293B' }}>
        <h2 style={{ color: '#FFF', fontSize: '14px', margin: 0 }}>Properties</h2>
      </div>
      <div style={{ padding: '16px', color: '#64748B', fontSize: '11px' }}>
        Select a route or compliance issue to inspect it.
      </div>
    </div>
  );
};