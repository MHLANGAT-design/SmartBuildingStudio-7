// src/modules/FixturePlacementStudio/Toolbar/groups/EditGroup.tsx
//
// Edit operations: Delete, Undo, Redo.
//
// LEVEL 1 LOCK ENFORCEMENT:
//   All three are edit operations. Disabled when the document is
//   locked by another user.
//
// Snap-to-grid will live here too once a snap flag is added to the
// slice — that's a Slice 4 (Placement) concern.

import React from 'react';
import { useFixtureLockState } from '@/modules/FixturePlacementStudio/hooks/useFixtureLockState';
import { DeleteFixtureButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/DeleteFixtureButton';
import { UndoButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/UndoButton';
import { RedoButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/RedoButton';

export const EditGroup: React.FC = () => {
  const { isReadOnly, lockedByUsername } = useFixtureLockState();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
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
      <DeleteFixtureButton />
    </div>
  );
};

export default EditGroup;