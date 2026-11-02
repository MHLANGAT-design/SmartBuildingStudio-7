// src/modules/DaliProgrammingStudio/Inspector/GatewayInspector.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

interface Props {
  gatewayId: string;
}

export const GatewayInspector: React.FC<Props> = ({ gatewayId }) => {
  const design = useAppSelector(selectApprovedDesign);
  const gateway = design?.topology.gateways.find(g => g.gatewayId === gatewayId);
  const lines = design?.topology.lines.filter(l => l.gatewayId === gatewayId) || [];

  if (!gateway) {
    return <div style={{ color: '#64748B', fontSize: 11 }}>Gateway not found</div>;
  }

  return (
    <div>
      <div style={titleStyle}>{gateway.name}</div>
      <div style={subtitleStyle}>{gateway.manufacturer} · {gateway.protocol}</div>

      <Section title="Status">
        <Row label="State" value={gateway.status} />
        <Row label="Gateway ID" value={gateway.gatewayId} mono />
      </Section>

      <Section title={`Managed Lines (${lines.length})`}>
        {lines.length === 0 ? (
          <div style={{ color: '#64748B', fontSize: 11 }}>No lines registered</div>
        ) : (
          lines.map(l => (
            <div
              key={l.lineId}
              style={{
                padding: '4px 8px',
                background: '#0F1424',
                border: '1px solid #1F2937',
                borderRadius: 3,
                marginBottom: 3,
                fontSize: 10,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ color: '#E5E7EB' }}>{l.name}</span>
              <span style={{ color: '#64748B', fontFamily: 'monospace' }}>
                {l.deviceCount}/{l.maxDevices}
              </span>
            </div>
          ))
        )}
      </Section>
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