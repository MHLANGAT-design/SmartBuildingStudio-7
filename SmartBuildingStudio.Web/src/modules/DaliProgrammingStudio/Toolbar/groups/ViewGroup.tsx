// src/modules/DaliProgrammingStudio/Toolbar/groups/ViewGroup.tsx

import React from 'react';
import { UndoButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/UndoButton';
import { RedoButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/RedoButton';

export const ViewGroup: React.FC = () => (
  <div style={{ display: 'flex', gap: 4 }}>
    <UndoButton />
    <RedoButton />
  </div>
);