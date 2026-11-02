// src/modules/DaliProgrammingStudio/Inspector/VerificationInspector.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectVerificationReport } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';
import { VERIFICATION_CHECK_RESULTS } from '@/modules/DaliProgrammingStudio/constants/verificationConstants';

interface Props {
  deviceId: string;
}

export const VerificationInspector: React.FC<Props> = ({ deviceId }) => {
  const report = useAppSelector(selectVerificationReport);
  const deviceResults = report?.deviceResults.find(r => r.deviceId === deviceId);

  if (!deviceResults) {
    return <div style={{ color: '#64748B', fontSize: 11 }}>No verification data for this device</div>;
  }

  return (
    <div>
      <div style={titleStyle}>Verification</div>
      <div style={subtitleStyle}>Device {deviceId}</div>

      <Section title="Overall Status">
        <Row label="Status" value={deviceResults.status} />
        <Row label="Checks" value={String(deviceResults.checks.length)} />
      </Section>

      <Section title="Checks">
        {deviceResults.checks.map(check => {
          const color = check.result === VERIFICATION_CHECK_RESULTS.PASS ? '#4ADE80' 
            : check.result === VERIFICATION_CHECK_RESULTS.FAIL ? '#F87171' 
            : '#94A3B8';
          return (
            <div
              key={check.checkId}
              style={{
                padding: 6,
                background: '#0F1424',
                border: `1px solid ${color}40`,
                borderRadius: 3,
                marginBottom: 4,
                fontSize: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ color: '#E5E7EB' }}>{check.parameter}</span>
                <span style={{ color, fontWeight: 'bold' }}>{check.result}</span>
              </div>
              <div style={{ color: '#64748B', fontFamily: 'monospace', fontSize: 9 }}>
                Expected: {JSON.stringify(check.expectedValue)} → Actual: {JSON.stringify(check.actualValue)}
              </div>
            </div>
          );
        })}
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

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{ color: '#E5E7EB' }}>{value}</span>
  </div>
);

const titleStyle: React.CSSProperties = { color: '#E5E7EB', fontSize: 13, fontWeight: 'bold', marginBottom: 2 };
const subtitleStyle: React.CSSProperties = { color: '#64748B', fontSize: 10, marginBottom: 12, fontFamily: 'monospace' };