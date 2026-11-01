// src/modules/EmergencyLighting/Canvas/EmergencyCanvas/DetailRow.tsx

import React from 'react';

export const DetailRow: React.FC<{
  label: string;
  value: string;
  valueColor?: string;
}> = ({ label, value, valueColor }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '1px 0' }}>
    <span style={{ color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3 }}>
      {label}
    </span>
    <span style={{ color: valueColor || '#E5E7EB', fontSize: 10, fontWeight: 'bold' }}>
      {value}
    </span>
  </div>
);

export default DetailRow;