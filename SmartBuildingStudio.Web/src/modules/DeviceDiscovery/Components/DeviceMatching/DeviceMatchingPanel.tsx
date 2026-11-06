// src/modules/DeviceDiscovery/Components/DeviceMatching/DeviceMatchingPanel.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectMatchingResults } from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';
import { DeviceMatchResult } from '@/modules/DeviceDiscovery/Components/DeviceMatching/DeviceMatchResult';

export const DeviceMatchingPanel: React.FC = () => {
  const matches = useAppSelector(selectMatchingResults);

  return (
    <div style={{ padding: 16 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 'bold',
        color: '#38BDF8',
        marginBottom: 12,
        textTransform: 'uppercase',
      }}>
        Device Matching ({matches.length})
      </div>

      {matches.length === 0 ? (
        <div style={{ color: '#64748B', fontSize: 12 }}>
          No matching results yet. Run a discovery to generate matches.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {matches.map(match => (
            <DeviceMatchResult
              key={match.discoveredDeviceId}
              match={match}
            />
          ))}
        </div>
      )}
    </div>
  );
};