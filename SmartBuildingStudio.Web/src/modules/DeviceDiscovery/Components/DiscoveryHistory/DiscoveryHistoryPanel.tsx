// src/modules/DeviceDiscovery/Components/DiscoveryHistory/DiscoveryHistoryPanel.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectActiveSession } from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';
import { DiscoveryHistoryDetails } from '@/modules/DeviceDiscovery/Components/DiscoveryHistory/DiscoveryHistoryDetails';

export const DiscoveryHistoryPanel: React.FC = () => {
  const session = useAppSelector(selectActiveSession);

  return (
    <div style={{ padding: 16 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 'bold',
        color: '#38BDF8',
        marginBottom: 12,
        textTransform: 'uppercase',
      }}>
        Discovery History
      </div>

      {!session ? (
        <div style={{ color: '#64748B', fontSize: 12 }}>No history available yet.</div>
      ) : (
        <DiscoveryHistoryDetails session={session} />
      )}
    </div>
  );
};