// src/modules/DaliProgrammingStudio/Inspector/DeviceInspector.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

interface Props {
  deviceId: string;
}

export const DeviceInspector: React.FC<Props> = ({ deviceId }) => {
  const design = useAppSelector(selectApprovedDesign);
  const device = design?.devices.find(d => d.deviceId === deviceId);

  if (!device) {
    return <div style={{ color: '#64748B', fontSize: 11 }}>Device not found</div>;
  }

  return (
    <div>
      <div style={titleStyle}>{device.logicalName}</div>
      <div style={subtitleStyle}>{device.role} · Type {device.deviceType}</div>

      <Section title="Identification">
        <Row label="Device ID" value={device.deviceId} mono />
        <Row label="Line" value={device.lineId} mono />
        <Row label="Address" value={String(device.hardwareAddress)} mono />
      </Section>

      <Section title="Parameters">
        <Row label="Min Level" value={fmt(device.parameters.minLevel)} />
        <Row label="Max Level" value={fmt(device.parameters.maxLevel)} />
        <Row label="Power-On" value={fmt(device.parameters.powerOnLevel)} />
        <Row label="Failure" value={fmt(device.parameters.systemFailureLevel)} />
        <Row label="Fade Time" value={fmt(device.parameters.fadeTime)} />
        <Row label="Fade Rate" value={fmt(device.parameters.fadeRate)} />
      </Section>

      {device.groups.length > 0 && (
        <Section title={`Groups (${device.groups.length})`}>
          {device.groups.map(g => (
            <Badge key={g.groupId} text={`${g.name} (${g.groupId})`} color="#60A5FA" />
          ))}
        </Section>
      )}

      {device.scenes.length > 0 && (
        <Section title={`Scenes (${device.scenes.length})`}>
          {device.scenes.map(s => (
            <Row key={s.sceneId} label={`Scene ${s.sceneId}`} value={`Level ${s.level}`} />
          ))}
        </Section>
      )}

      {device.d4iTypes && device.d4iTypes.length > 0 && (
        <Section title="D4i Capabilities">
          {device.d4iTypes.map(t => (
            <Badge key={t} text={t} color="#38BDF8" />
          ))}
        </Section>
      )}
    </div>
  );
};

const fmt = (v: number | undefined) => (v === undefined ? '—' : String(v));

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ color: '#38BDF8', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
      {title}
    </div>
    <div>{children}</div>
  </div>
);

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{ color: '#E5E7EB', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
  </div>
);

const Badge: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '1px 6px',
      background: `${color}15`,
      border: `1px solid ${color}40`,
      borderRadius: 3,
      color,
      fontSize: 9,
      marginRight: 4,
      marginBottom: 4,
    }}
  >
    {text}
  </span>
);

const titleStyle: React.CSSProperties = {
  color: '#E5E7EB',
  fontSize: 13,
  fontWeight: 'bold',
  marginBottom: 2,
};

const subtitleStyle: React.CSSProperties = {
  color: '#64748B',
  fontSize: 10,
  marginBottom: 12,
  fontFamily: 'monospace',
};