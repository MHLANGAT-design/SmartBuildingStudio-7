// src/modules/DaliProgrammingStudio/Inspector/AddressInspector.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign, selectDeploymentResult } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

interface Props {
  lineId: string;
  address: number;
}

export const AddressInspector: React.FC<Props> = ({ lineId, address }) => {
  const design = useAppSelector(selectApprovedDesign);
  const deployment = useAppSelector(selectDeploymentResult);

  const device = design?.devices.find(
    d => d.lineId === lineId && d.hardwareAddress === address
  );

  return (
    <div>
      <div style={titleStyle}>Address {address}</div>
      <div style={subtitleStyle}>Line {lineId}</div>

      <Section title="Assignment">
        {device ? (
          <>
            <Row label="Device" value={device.logicalName} />
            <Row label="Device ID" value={device.deviceId} mono />
            <Row label="Role" value={device.role} />
            <Row label="Type" value={String(device.deviceType)} mono />
          </>
        ) : (
          <div style={{ color: '#64748B', fontSize: 11 }}>No device assigned to this address</div>
        )}
      </Section>

      {device && (
        <Section title="Programming Status">
          <Row
            label="Programmed"
            value={deployment?.successfulSequences.some(id => id.includes(device.deviceId)) ? 'Yes' : 'No'}
          />
          <Row
            label="Failed"
            value={deployment?.failedSequences.some(id => id.includes(device.deviceId)) ? 'Yes' : 'No'}
          />
        </Section>
      )}
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ color: '#38BDF8', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
      {title}
    </div>
    {children}
  </div>
);

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{ color: '#E5E7EB', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
  </div>
);

const titleStyle: React.CSSProperties = { color: '#E5E7EB', fontSize: 13, fontWeight: 'bold', marginBottom: 2 };
const subtitleStyle: React.CSSProperties = { color: '#64748B', fontSize: 10, marginBottom: 12, fontFamily: 'monospace' };