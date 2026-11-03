// src/modules/Commissioning/Toolbar/buttons/TestSceneButton.tsx

import React from 'react';
import { useSceneTesting } from '@/modules/Commissioning/hooks/useSceneTesting';

interface Props {
  onClick: () => void;
}

export const TestSceneButton: React.FC<Props> = ({ onClick }) => {
  const { isTesting } = useSceneTesting();

  return (
    <button
      onClick={onClick}
      disabled={isTesting}
      style={{
        padding: '4px 10px',
        background: isTesting ? '#1F2937' : '#1E293B',
        color: isTesting ? '#64748B' : '#E5E7EB',
        border: '1px solid #334155',
        borderRadius: 3,
        fontSize: 10,
        cursor: isTesting ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {isTesting ? 'Testing Scenes...' : 'Test Scenes'}
    </button>
  );
};