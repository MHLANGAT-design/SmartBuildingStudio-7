// src/modules/DeviceDiscovery/Components/DiscoveryResults/DiscoveryExceptions.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectDiscoveredDevices } from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';

export const DiscoveryExceptions: React.FC = () => {
  const devices = useAppSelector(selectDiscoveredDevices);
  const exceptions = devices.filter(d => d.status === 'EXCEPTION');

  if (exceptions.length === 0) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 'bold', color: '#F87171', marginBottom: 6 }}>
        Exceptions ({exceptions.length})
      </div>
      <ul style={{ margin: 0, paddingLeft: 20, color: '#FCA5A5', fontSize: 11 }}>
        {exceptions.map(e => (
          <li key={e.deviceId}>{e.deviceId} ({e.manufacturer ?? 'unknown'})</li>
        ))}
      </ul>
    </div>
  );
};