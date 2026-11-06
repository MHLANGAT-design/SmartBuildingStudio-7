// src/modules/DeviceDiscovery/Components/DeviceInspector/DeviceProperties.tsx

import React from 'react';
import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Types/DeviceDiscovery.types';

interface Props {
  device: DiscoveredDevice;
}

export const DeviceProperties: React.FC<Props> = ({ device }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <Row label="Device ID" value={device.deviceId} mono />
    <Row label="Manufacturer" value={device.manufacturer ?? 'Unknown'} />
    <Row label="Firmware" value={device.firmwareVersion ?? 'N/A'} />
    <Row label="Short Address" value={device.shortAddress?.toString() ?? 'Unaddressed'} mono />
    <Row label="Random Address" value={device.randomAddress} mono />
    <Row label="Matched Fixture" value={device.matchedFixtureId ?? '—'} mono />
  </div>
);

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <div style={{ fontSize: 10, color: '#64748B' }}>{label}</div>
    <div style={{ fontSize: 13, color: '#E5E7EB', fontFamily: mono ? 'monospace' : undefined }}>
      {value}
    </div>
  </div>
);