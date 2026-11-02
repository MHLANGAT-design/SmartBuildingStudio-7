// src/modules/DaliProgrammingStudio/Sidebar/DeviceCapabilities/DeviceTypeProfile.tsx

import React from 'react';
import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import { DALI_DEVICE_TYPES } from '@/modules/DaliProgrammingStudio/constants/daliDeviceTypes';

interface Props {
  device: DaliDeviceDefinition;
}

export const DeviceTypeProfile: React.FC<Props> = ({ device }) => {
  const typeName = Object.entries(DALI_DEVICE_TYPES).find(([_, v]) => v === device.deviceType)?.[0] || `Type ${device.deviceType}`;

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>Type Profile</div>
      <Row label="Name" value={device.logicalName} />
      <Row label="Role" value={device.role} />
      <Row label="Type" value={typeName.replace(/_/g, ' ')} />
      {device.d4iTypes && device.d4iTypes.length > 0 && (
        <Row label="D4i" value={device.d4iTypes.join(', ')} />
      )}
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{ color: '#E5E7EB', fontFamily: 'monospace' }}>{value}</span>
  </div>
);

const cardStyle: React.CSSProperties = {
  background: '#0F1424',
  border: '1px solid #1F2937',
  borderRadius: 4,
  padding: 8,
  marginBottom: 8,
};

const titleStyle: React.CSSProperties = {
  color: '#38BDF8',
  fontSize: 10,
  fontWeight: 'bold',
  marginBottom: 6,
  textTransform: 'uppercase',
};