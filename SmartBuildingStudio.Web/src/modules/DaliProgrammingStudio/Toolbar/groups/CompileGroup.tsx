// src/modules/DaliProgrammingStudio/Toolbar/groups/CompileGroup.tsx

import React from 'react';
import { CompileConfigurationButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/CompileConfigurationButton';
import { ValidateConfigurationButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/ValidateConfigurationButton';
import { PreviewCommandsButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/PreviewCommandsButton';

interface Props {
  onPreviewClick: () => void;
}

export const CompileGroup: React.FC<Props> = ({ onPreviewClick }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    <CompileConfigurationButton />
    <ValidateConfigurationButton />
    <PreviewCommandsButton onClick={onPreviewClick} />
  </div>
);