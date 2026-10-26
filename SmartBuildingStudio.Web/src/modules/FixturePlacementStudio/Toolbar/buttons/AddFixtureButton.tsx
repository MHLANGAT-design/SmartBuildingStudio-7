// src/modules/FixturePlacementStudio/Toolbar/buttons/AddFixtureButton.tsx
//
// Opens the Add Fixture dialog. Placement mode is entered by the
// dialog itself (via setPlacementProduct) after the user picks a
// product — this button only opens the modal.
//
// LEVEL 1 LOCK ENFORCEMENT: disabled when the current FPS document is
// locked by another user. Placement would be rejected by the backend
// on save anyway (423), but disabling the button prevents the user
// from going through the whole selection flow only to fail.

import React, { useState } from 'react';
import { useFixtureLockState } from '@/modules/FixturePlacementStudio/hooks/useFixtureLockState';
import { AddFixtureDialog } from '@/modules/FixturePlacementStudio/Dialogs/AddFixtureDialog';

export const AddFixtureButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { isReadOnly, lockedByUsername } = useFixtureLockState();

  const disabled = isReadOnly;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={
          isReadOnly
            ? `Read-only: locked by ${lockedByUsername || 'another user'}`
            : 'Add a fixture to the layout'
        }
        style={{
          ...button,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          border: `1px solid ${disabled ? '#334155' : '#10B981'}`,
          background: disabled
            ? 'rgba(30, 41, 59, 0.4)'
            : 'rgba(16, 185, 129, 0.12)',
          color: disabled ? '#64748B' : '#6EE7B7',
        }}
      >
        {disabled ? '🔒 Add Fixture' : '➕ Add Fixture'}
      </button>
      <AddFixtureDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
};

const button: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 4,
  fontSize: 11,
  fontFamily: 'monospace',
  fontWeight: 'bold',
  transition: 'background 0.1s, border-color 0.1s, color 0.1s',
};

export default AddFixtureButton;