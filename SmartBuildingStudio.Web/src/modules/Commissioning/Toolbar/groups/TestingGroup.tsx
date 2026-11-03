// src/modules/Commissioning/Toolbar/groups/TestingGroup.tsx

import React from 'react';
import { useSceneTesting } from '@/modules/Commissioning/hooks/useSceneTesting';

interface Props {
  onOpenSceneTestDialog: () => void;
}

export const TestingGroup: React.FC<Props> = ({ onOpenSceneTestDialog }) => {
  const { isTesting } = useSceneTesting();

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button
        onClick={onOpenSceneTestDialog}
        disabled={isTesting}
        style={{
          padding: '4px 10px',
          background: isTesting ? '#1F2937' : '#1E293B',
          color: isTesting ? '#64748B' : '#E5E7EB',
          border: '1px solid #334155',
          borderRadius: 3,
          fontSize: 10,
          cursor: isTesting ? 'not-allowed' : 'pointer',
        }}
      >
        {isTesting ? 'Testing Scenes...' : 'Test Scenes'}
      </button>
    </div>
  );
};