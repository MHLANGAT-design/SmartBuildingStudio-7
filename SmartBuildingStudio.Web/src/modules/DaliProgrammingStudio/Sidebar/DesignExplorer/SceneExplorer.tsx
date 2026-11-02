// src/modules/DaliProgrammingStudio/Sidebar/DesignExplorer/SceneExplorer.tsx

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectApprovedDesign } from '@/modules/DaliProgrammingStudio/store/programmingSelectors';

export const SceneExplorer: React.FC = () => {
  const design = useAppSelector(selectApprovedDesign);

  if (!design) return <div style={{ color: '#64748B', fontSize: 11, padding: 8 }}>No design loaded</div>;

  if (design.scenes.length === 0) {
    return <div style={{ color: '#64748B', fontSize: 11, padding: 8 }}>No scenes defined</div>;
  }

  return (
    <div>
      {design.scenes.map(scene => (
        <div
          key={scene.sceneId}
          style={{
            padding: '6px 8px',
            background: '#0F1424',
            border: '1px solid #1F2937',
            borderRadius: 4,
            marginBottom: 4,
            fontSize: 11,
          }}
        >
          <div style={{ color: '#E5E7EB', fontWeight: 'bold' }}>{scene.name}</div>
          <div style={{ color: '#64748B', fontSize: 10, marginTop: 2, fontFamily: 'monospace' }}>
            Scene ID: {scene.sceneId}
          </div>
        </div>
      ))}
    </div>
  );
};