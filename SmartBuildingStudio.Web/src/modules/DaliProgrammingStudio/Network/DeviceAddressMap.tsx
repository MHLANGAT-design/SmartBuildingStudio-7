// src/modules/DaliProgrammingStudio/Network/DeviceAddressMap.tsx

import React from 'react';
import { DALI_HARD_LIMITS } from '@/modules/DaliProgrammingStudio/constants/daliConstants';

interface Props {
  lineId: string;
  occupiedAddresses: number[];
  verifiedAddresses?: number[];
  failedAddresses?: number[];
  onAddressClick?: (address: number) => void;
}

export const DeviceAddressMap: React.FC<Props> = ({ 
  lineId,
  occupiedAddresses, 
  verifiedAddresses = [],
  failedAddresses = [],
  onAddressClick 
}) => {
  const cells = [];
  for (let addr = DALI_HARD_LIMITS.MIN_SHORT_ADDRESS; addr <= DALI_HARD_LIMITS.MAX_SHORT_ADDRESS; addr++) {
    const occupied = occupiedAddresses.includes(addr);
    const verified = verifiedAddresses.includes(addr);
    const failed = failedAddresses.includes(addr);

    let bg = '#111827';
    let border = '#1F2937';
    if (failed) { bg = '#3F1D1D'; border = '#F87171'; }
    else if (verified) { bg = '#143021'; border = '#4ADE80'; }
    else if (occupied) { bg = '#1E293B'; border = '#60A5FA'; }

    cells.push(
      <div
        key={addr}
        onClick={() => onAddressClick?.(addr)}
        title={`Address ${addr}`}
        style={{
          width: 18,
          height: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 3,
          fontSize: 9,
          fontFamily: 'monospace',
          color: occupied ? '#E5E7EB' : '#475569',
          cursor: occupied ? 'pointer' : 'default',
        }}
      >
        {addr}
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4, fontFamily: 'monospace' }}>
        Line {lineId}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: 2 }}>
        {cells}
      </div>
    </div>
  );
};