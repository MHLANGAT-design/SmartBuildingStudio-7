// src/modules/Commissioning/Inspector/TestResultInspector.tsx

import React from 'react';
import type { TestResult } from '@/modules/Commissioning/models/TestResult';

interface Props {
  result: TestResult;
}

export const TestResultInspector: React.FC<Props> = ({ result }) => {
  return (
    <div style={{ fontSize: 11 }}>
      <div style={{ color: result.status === 'PASS' ? '#4ADE80' : '#F87171', fontWeight: 'bold', marginBottom: 8 }}>
        {result.status}
      </div>
      <Row label="Test Type" value={result.testType} />
      <Row label="Target" value={result.targetId} />
      <Row label="Duration" value={`${result.durationMs}ms`} />
      <div style={{ marginTop: 8, padding: 8, background: '#0A0F1E', borderRadius: 4, fontSize: 10, fontFamily: 'monospace' }}>
        <div style={{ color: '#64748B' }}>Expected:</div>
        <div style={{ color: '#E5E7EB', marginBottom: 4 }}>{JSON.stringify(result.expectedValue)}</div>
        <div style={{ color: '#64748B' }}>Actual:</div>
        <div style={{ color: '#E5E7EB' }}>{JSON.stringify(result.actualValue)}</div>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{ color: '#E5E7EB', fontFamily: 'monospace' }}>{value}</span>
  </div>
);