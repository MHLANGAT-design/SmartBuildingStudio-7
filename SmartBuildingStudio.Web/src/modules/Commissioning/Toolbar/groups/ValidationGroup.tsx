// src/modules/Commissioning/Toolbar/groups/ValidationGroup.tsx

import React from 'react';
import { GenerateCommissioningReportButton } from '@/modules/Commissioning/Toolbar/buttons/GenerateCommissioningReportButton';
import { ResolveConflictsButton } from '@/modules/Commissioning/Toolbar/buttons/ResolveConflictsButton';

interface Props {
  onOpenReportDialog: () => void;
  onOpenResolveConflicts?: () => void;
}

export const ValidationGroup: React.FC<Props> = ({
  onOpenReportDialog,
  onOpenResolveConflicts,
}) => {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <GenerateCommissioningReportButton onClick={onOpenReportDialog} />
      <ResolveConflictsButton
        onClick={() => {
          if (onOpenResolveConflicts) onOpenResolveConflicts();
        }}
      />
    </div>
  );
};