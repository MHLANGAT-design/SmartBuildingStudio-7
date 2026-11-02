// src/modules/DaliProgrammingStudio/Toolbar/groups/ProjectGroup.tsx

import React from 'react';
import { LoadDesignButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/LoadDesignButton';
import { RefreshDesignButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/RefreshDesignButton';

interface Props {
  onLoadClick: () => void;
}

export const ProjectGroup: React.FC<Props> = ({ onLoadClick }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    <LoadDesignButton onClick={onLoadClick} />
    <RefreshDesignButton />
  </div>
);