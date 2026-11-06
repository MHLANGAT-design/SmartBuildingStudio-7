// src/modules/DeviceDiscovery/Components/DeviceInspector/DeviceCommunicationStatus.tsx

import React from 'react';

interface Props {
  status: 'UNKNOWN' | 'IDENTIFIED' | 'MATCHED' | 'EXCEPTION';
  isOnline: boolean;
}

export const DeviceCommunicationStatus: React.FC<Props> = ({ status, isOnline }) => {
  const color =
    status === 'MATCHED' ? '#4ADE80'
    : status === 'EXCEPTION' ? '#F87171'
    : '#FBBF24';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
      <span style={{ color: '#64748B' }}>Status</span>
      <span style={{ color, fontWeight: 'bold' }}>
        {status} · {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
};