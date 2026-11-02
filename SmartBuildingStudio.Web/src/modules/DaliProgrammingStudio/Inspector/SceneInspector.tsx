// src/modules/DaliProgrammingStudio/Inspector/SceneInspector.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

interface Props {
  sceneId: number;
}

export const SceneInspector: React.FC<Props> = ({ sceneId }) => {
  const design = useAppSelector(selectApprovedDesign);
  const scene = design?.scenes.find(s => s.sceneId === sceneId);
  const affected = design?.devices.filter(d => d.scenes.some(s => s.sceneId === sceneId)) || [];

  if (!scene) {
    return <div style={{ color: '#64748B', fontSize: 11 }}>Scene not found</div>;
  }

  return (
    <div>
      <div style={titleStyle}>{scene.name}</div>
      <div style={subtitleStyle}>Scene ID: {scene.sceneId}</div>

      <Section title={`Affected Devices (${affected.length})`}>
        {affected.length === 0 ? (
          <div style={{ color: '#64748B', fontSize: 11 }}>No devices in this scene</div>
        ) : (
          affected.map(d => {
            const sceneAssignment = d.scenes.find(s => s.sceneId === sceneId);
            return (
              <div
                key={d.deviceId}
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
                <span style={{ color: '#E5E7EB' }}>{d.logicalName}</span>
                <span style={{ color: '#38BDF8', fontFamily: 'monospace' }}>
                  L{sceneAssignment?.level ?? '—'}
                </span>
              </div>
            );
          })
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

const titleStyle: React.CSSProperties = { color: '#E5E7EB', fontSize: 13, fontWeight: 'bold', marginBottom: 2 };
const subtitleStyle: React.CSSProperties = { color: '#64748B', fontSize: 10, marginBottom: 12, fontFamily: 'monospace' };