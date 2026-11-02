// src/modules/FixturePlacementStudio/Toolbar/groups/EditGroup.tsx
//
// Edit operations: Undo, Redo, Snap-to-Grid, Delete.
//
// LEVEL 1 LOCK ENFORCEMENT:
//   All four are edit operations. Disabled when the document is
//   locked by another user.

import React from 'react';
import { useFixtureLockState } from '@/modules/FixturePlacementStudio/hooks/useFixtureLockState';
import { DeleteFixtureButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/DeleteFixtureButton';
import { UndoButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/UndoButton';
import { RedoButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/RedoButton';
import { SnapToGridButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/SnapToGridButton';

export const EditGroup: React.FC = () => {
  const { isReadOnly, lockedByUsername } = useFixtureLockState();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
        rowGap: 4,
        opacity: isReadOnly ? 0.45 : 1,
        pointerEvents: isReadOnly ? 'none' : 'auto',
        transition: 'opacity 0.15s',
      }}
      title={
        isReadOnly
          ? `Read-only: document is locked by ${lockedByUsername || 'another user'}`
          : undefined
      }
    >
      <UndoButton />
      <RedoButton />
      <span style={divider}>|</span>
      <SnapToGridButton />
      <span style={divider}>|</span>
      <DeleteFixtureButton />
    </div>
  );
};

const divider: React.CSSProperties = {
  color: '#334155',
  fontSize: 11,
  userSelect: 'none',
  margin: '0 2px',
};

export default EditGroup;