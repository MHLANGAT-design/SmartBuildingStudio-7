// src/modules/FixturePlacementStudio/Toolbar/buttons/DeleteFixtureButton.tsx
//
// Deletes every currently selected fixture. Disabled when nothing is
// selected. Matches the behavior already wired in FixtureCanvas's
// Delete/Backspace key handler — same slice action, same payload.

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { deleteFixtures } from '@/modules/FixturePlacementStudio/store/fixtureSlice';
import { selectSelectedFixtureIds } from '@/modules/FixturePlacementStudio/store/fixtureSelectors';

export const DeleteFixtureButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedFixtureIds = useAppSelector(selectSelectedFixtureIds);

  const disabled = selectedFixtureIds.length === 0;

  const handleClick = () => {
    if (disabled) return;
    dispatch(deleteFixtures({ fixtureIds: selectedFixtureIds }));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={
        disabled
          ? 'Select one or more fixtures to delete'
          : `Delete ${selectedFixtureIds.length} fixture${
              selectedFixtureIds.length > 1 ? 's' : ''
            } (Delete)`
      }
      style={{
        ...button,
        background: disabled
          ? 'rgba(30, 41, 59, 0.4)'
          : 'rgba(239, 68, 68, 0.12)',
        borderColor: disabled ? '#1E293B' : '#EF4444',
        color: disabled ? '#475569' : '#FCA5A5',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      🗑 Delete
      {selectedFixtureIds.length > 1 ? ` (${selectedFixtureIds.length})` : ''}
    </button>
  );
};

const button: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 4,
  border: '1px solid #1E293B',
  fontSize: 11,
  fontFamily: 'monospace',
  transition: 'background 0.1s, border-color 0.1s, color 0.1s',
};

export default DeleteFixtureButton;