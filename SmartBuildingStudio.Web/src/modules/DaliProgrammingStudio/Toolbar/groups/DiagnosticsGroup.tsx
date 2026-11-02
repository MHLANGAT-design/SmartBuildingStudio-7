// src/modules/DaliProgrammingStudio/Toolbar/groups/DiagnosticsGroup.tsx

import React from 'react';
import { RunDiagnosticsButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/RunDiagnosticsButton';
import { BackupConfigurationButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/BackupConfigurationButton';
import { RestoreConfigurationButton } from '@/modules/DaliProgrammingStudio/Toolbar/buttons/RestoreConfigurationButton';

interface Props {
  onDiagnosticsClick: () => void;
  onBackupClick: () => void;
  onRestoreClick: () => void;
}

export const DiagnosticsGroup: React.FC<Props> = ({ onDiagnosticsClick, onBackupClick, onRestoreClick }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    <RunDiagnosticsButton onClick={onDiagnosticsClick} />
    <BackupConfigurationButton onClick={onBackupClick} />
    <RestoreConfigurationButton onClick={onRestoreClick} />
  </div>
);