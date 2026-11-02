// src/modules/FixturePlacementStudio/Toolbar/buttons/SnapToGridButton.tsx
//
// Snaps the selected fixtures' (x, y) to the nearest grid multiple.
// Grid size is 500mm — matches the light-fixture spacing used in the
// FPS canvas.
//
// Uses the batch `repositionFixtures` action so moved fixtures keep
// their roomId and one undo snapshot covers the whole operation.

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/Application/ConfigureStore';
import {
  selectFixtures,
  selectSelectedFixtureIds,
} from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import {
  repositionFixtures,
} from '@/modules/FixturePlacementStudio/store/fixtureSlice';
import { useFixtureLockState } from '@/modules/FixturePlacementStudio/hooks/useFixtureLockState';

const GRID_MM = 500;

export const SnapToGridButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isReadOnly, lockedByUsername } = useFixtureLockState();
  const fixtures = useAppSelector(selectFixtures);
  const selectedIds = useAppSelector(selectSelectedFixtureIds);

  const disabled = isReadOnly || selectedIds.length < 1;

  const handleClick = () => {
    if (disabled) return;

    const selected = fixtures.filter((f) => selectedIds.includes(f.id));
    const positions = selected
      .map((f) => ({
        id: f.id,
        x: Math.round(f.x / GRID_MM) * GRID_MM,
        y: Math.round(f.y / GRID_MM) * GRID_MM,
      }))
      .filter((p, i) => p.x !== selected[i].x || p.y !== selected[i].y);

    if (positions.length === 0) return;
    dispatch(repositionFixtures({ positions }));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={
        isReadOnly
          ? `Read-only: locked by ${lockedByUsername || 'another user'}`
          : selectedIds.length < 1
          ? 'Select at least one fixture to snap'
          : `Snap selected fixtures to ${GRID_MM}mm grid`
      }
      style={{
        ...button,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        border: `1px solid ${disabled ? '#334155' : '#F59E0B'}`,
        background: disabled
          ? 'rgba(30, 41, 59, 0.4)'
          : 'rgba(245, 158, 11, 0.12)',
        color: disabled ? '#64748B' : '#FBBF24',
      }}
    >
      {disabled ? '🔒 Snap to Grid' : '⊡ Snap to Grid'}
    </button>
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

export default SnapToGridButton;