// src/modules/Commissioning/Inspector/DeviceInspector.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectActiveSession } from '@/modules/Commissioning/store/commissioningSelectors';

interface Props {
  deviceId: string;
}

export const DeviceInspector: React.FC<Props> = ({ deviceId }) => {
  const session = useAppSelector(selectActiveSession);
  const device = session?.deviceStates[deviceId];

  if (!device) return <div style={{ color: '#64748B', fontSize: 11 }}>Device not found.</div>;

  return (
    <div style={{ fontSize: 11 }}>
      <div style={{ color: '#38BDF8', fontWeight: 'bold', marginBottom: 8 }}>{device.deviceId}</div>
      <Row label="Status" value={device.connectionStatus} />
      <Row label="Address" value={String(device.shortAddress ?? 'Unassigned')} />
      <Row label="Firmware" value={device.firmwareVersion ?? '—'} />
      <Row label="Last Response" value={device.lastResponseAt ? new Date(device.lastResponseAt).toLocaleTimeString() : '—'} />
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{ color: '#E5E7EB', fontFamily: 'monospace' }}>{value}</span>
  </div>
);