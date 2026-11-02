// src/modules/DaliProgrammingStudio/Sidebar/DeviceCapabilities/ControlDeviceCapabilities.tsx

import React from 'react';
import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';

interface Props {
  device: DaliDeviceDefinition;
}

export const ControlDeviceCapabilities: React.FC<Props> = ({ device }) => {
  return (
    <div style={cardStyle}>
      <div style={titleStyle}>Control Device</div>
      <Row label="Sensor Input" value="✓ Supported" positive />
      <Row label="Push Button" value="✓ Supported" positive />
      <Row label="Group Configuration" value="✗ Not Supported" />
      <Row label="Scene Configuration" value="✗ Not Supported" />
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; positive?: boolean }> = ({ label, value, positive }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{ color: positive ? '#4ADE80' : '#94A3B8' }}>{value}</span>
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