// src/modules/DaliProgrammingStudio/Toolbar/ProgrammingToolbar.tsx

import React from 'react';
import { ProjectGroup } from '@/modules/DaliProgrammingStudio/Toolbar/groups/ProjectGroup';
import { CompileGroup } from '@/modules/DaliProgrammingStudio/Toolbar/groups/CompileGroup';
import { AddressGroup } from '@/modules/DaliProgrammingStudio/Toolbar/groups/AddressGroup';
import { ConfigurationGroup } from '@/modules/DaliProgrammingStudio/Toolbar/groups/ConfigurationGroup';
import { DeploymentGroup } from '@/modules/DaliProgrammingStudio/Toolbar/groups/DeploymentGroup';
import { VerificationGroup } from '@/modules/DaliProgrammingStudio/Toolbar/groups/VerificationGroup';
import { DiagnosticsGroup } from '@/modules/DaliProgrammingStudio/Toolbar/groups/DiagnosticsGroup';
import { ViewGroup } from '@/modules/DaliProgrammingStudio/Toolbar/groups/ViewGroup';

interface Props {
  onLoadClick: () => void;
  onPreviewClick: () => void;
  onDeployClick: () => void;
  onVerifyClick: () => void;
  onReadBackClick: () => void;
  onDiagnosticsClick: () => void;
  onBackupClick: () => void;
  onRestoreClick: () => void;
}

export const ProgrammingToolbar: React.FC<Props> = ({ 
  onLoadClick, 
  onPreviewClick,
  onDeployClick, 
  onVerifyClick, 
  onReadBackClick, 
  onDiagnosticsClick, 
  onBackupClick, 
  onRestoreClick 
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 12px',
        background: '#0F1424',
        borderBottom: '1px solid #1F2937',
        flexWrap: 'wrap',
      }}
    >
      <ProjectGroup onLoadClick={onLoadClick} />
      <Divider />
      <CompileGroup onPreviewClick={onPreviewClick} />
      <Divider />
      <AddressGroup />
      <Divider />
      <ConfigurationGroup />
      <Divider />
      <DeploymentGroup onDeployClick={onDeployClick} />
      <Divider />
      <VerificationGroup onVerifyClick={onVerifyClick} onReadBackClick={onReadBackClick} />
      <Divider />
      <DiagnosticsGroup 
        onDiagnosticsClick={onDiagnosticsClick} 
        onBackupClick={onBackupClick} 
        onRestoreClick={onRestoreClick} 
      />
      <Divider />
      <ViewGroup />
    </div>
  );
};

const Divider: React.FC = () => (
  <div style={{ width: 1, height: 20, background: '#1F2937', margin: '0 4px', flexShrink: 0 }} />
);

export default ProgrammingToolbar;