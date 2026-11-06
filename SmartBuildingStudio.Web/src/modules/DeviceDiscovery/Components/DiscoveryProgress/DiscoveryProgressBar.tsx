// src/modules/DeviceDiscovery/Components/DiscoveryProgress/DiscoveryProgressBar.tsx

import React from 'react';

interface Props {
  /** 0–100. Values outside the range are clamped. */
  percent: number;
  label?: string;
}

export const DiscoveryProgressBar: React.FC<Props> = ({ percent, label }) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const color = clamped >= 100 ? '#4ADE80' : clamped > 0 ? '#38BDF8' : '#1F2937';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B' }}>
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div style={{
        height: 6,
        width: '100%',
        background: '#1F2937',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${clamped}%`,
          background: color,
          transition: 'width 250ms ease, background 250ms ease',
        }} />
      </div>
    </div>
  );
};