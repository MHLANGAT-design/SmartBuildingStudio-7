// src/modules/Commissioning/Inspector/SceneInspector.tsx

import React from 'react';
import type { SceneTest } from '@/modules/Commissioning/models/SceneTest';

interface Props {
  sceneTest: SceneTest;
}

export const SceneInspector: React.FC<Props> = ({ sceneTest }) => {
  return (
    <div style={{ fontSize: 11 }}>
      <div style={{ color: '#38BDF8', fontWeight: 'bold', marginBottom: 8 }}>{sceneTest.sceneName}</div>
      <Row label="Status" value={sceneTest.status} />
      <Row label="Steps" value={String(sceneTest.steps.length)} />
      
      <div style={{ marginTop: 12, borderTop: '1px solid #1F2937', paddingTop: 8 }}>
        <div style={{ color: '#64748B', marginBottom: 4 }}>Device Verification:</div>
        {sceneTest.steps.map(step => (
          <div key={step.deviceId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '2px 0' }}>
            <span style={{ color: '#E5E7EB' }}>{step.deviceId}</span>
            <span style={{ color: step.passed ? '#4ADE80' : '#F87171' }}>
              {step.passed ? 'PASS' : `FAIL (Exp: ${step.expectedLevel}, Act: ${step.actualLevel})`}
            </span>
          </div>
        ))}
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