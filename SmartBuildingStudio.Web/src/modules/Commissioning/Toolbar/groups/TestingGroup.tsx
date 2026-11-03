// src/modules/Commissioning/Toolbar/groups/TestingGroup.tsx

import React from 'react';
import { TestSceneButton } from '@/modules/Commissioning/Toolbar/buttons/TestSceneButton';

interface Props {
  onOpenSceneTestDialog: () => void;
}

export const TestingGroup: React.FC<Props> = ({ onOpenSceneTestDialog }) => {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <TestSceneButton onClick={onOpenSceneTestDialog} />
    </div>
  );
};