// src/modules/DeviceDiscovery/Components/DeviceMatching/DesignDiscrepancyPanel.tsx
import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectDiscoveredDevices } from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';

export const DesignDiscrepancyPanel: React.FC = () => {
  const devices = useAppSelector(selectDiscoveredDevices);
  const unmatched = devices.filter(d => d.status === 'IDENTIFIED');

  if (unmatched.length === 0) return null;

  return (
    <div style={{ padding: 16, background: '#1E293B', borderRadius: 6, marginTop: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 'bold', color: '#FBBF24', marginBottom: 12 }}>
        Resolve Discrepancies
      </div>
      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 12 }}>
        The following devices were found physically but do not match any fixture in the intended design. You can assign them manually.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {unmatched.map(dev => (
          <div key={dev.deviceId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0F1424', padding: 8, borderRadius: 4 }}>
            <span style={{ fontSize: 12, color: '#E5E7EB' }}>{dev.deviceId}</span>
            <button style={{ padding: '4px 8px', background: '#1D4ED8', color: '#FFF', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
              Assign to Design
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};