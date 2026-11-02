// src/modules/DaliProgrammingStudio/Toolbar/groups/VerificationGroup.tsx

import React from 'react';
import { VerifyConfigurationButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/VerifyConfigurationButton';
import { ReadBackConfigurationButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/ReadBackConfigurationButton';

interface Props {
  onVerifyClick: () => void;
  onReadBackClick: () => void;
}

export const VerificationGroup: React.FC<Props> = ({ onVerifyClick, onReadBackClick }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    <VerifyConfigurationButton onClick={onVerifyClick} />
    <ReadBackConfigurationButton onClick={onReadBackClick} />
  </div>
);