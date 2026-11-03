// src/modules/Commissioning/Inspector/NetworkInspector.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectActiveSession } from '@/modules/Commissioning/store/commissioningSelectors';

interface Props {
  lineId: string;
}

export const NetworkInspector: React.FC<Props> = ({ lineId }) => {
  const session = useAppSelector(selectActiveSession);
  const net = session?.networkStates[lineId];

  if (!net) return <div style={{ color: '#64748B', fontSize: 11 }}>Network not found.</div>;

  return (
    <div style={{ fontSize: 11 }}>
      <div style={{ color: '#38BDF8', fontWeight: 'bold', marginBottom: 8 }}>Line {net.lineId}</div>
      <Row label="Gateway" value={net.gatewayId} />
      <Row label="Devices" value={`${net.onlineDevices} / ${net.totalDevices}`} />
      <Row label="Errors" value={String(net.errorCount)} />
      <Row label="Bus Voltage" value={net.busVoltage ? `${net.busVoltage}V` : '—'} />
      <Row label="Last Scan" value={net.lastScanAt ? new Date(net.lastScanAt).toLocaleTimeString() : '—'} />
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{ color: '#E5E7EB', fontFamily: 'monospace' }}>{value}</span>
  </div>
);