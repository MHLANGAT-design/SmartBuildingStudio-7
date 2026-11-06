// src/modules/DeviceDiscovery/Components/DeviceIdentification/DeviceAddressInformation.tsx

import React from 'react';
import type { DeviceIdentification } from '@/modules/DeviceDiscovery/Models/DeviceIdentification';

interface Props {
  identification: DeviceIdentification;
}

export const DeviceAddressInformation: React.FC<Props> = ({ identification }) => {
  // Address info is part of the identified device payload; we keep it here as a
  // dedicated card so the inspector layout matches the frozen tree.
  return (
    <div style={{
      background: '#0F1424',
      border: '1px solid #1F2937',
      borderRadius: 4,
      padding: 12,
    }}>
      <div style={{ fontSize: 10, color: '#64748B', marginBottom: 6 }}>Address Information</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748B' }}>Device</span>
          <span style={{ color: '#E5E7EB', fontFamily: 'monospace' }}>
            {identification.deviceId}
          </span>
        </div>
      </div>
    </div>
  );
};