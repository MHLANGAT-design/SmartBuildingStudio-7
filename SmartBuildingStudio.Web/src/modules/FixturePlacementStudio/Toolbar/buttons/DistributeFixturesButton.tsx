// src/modules/FixturePlacementStudio/Toolbar/buttons/DistributeFixturesButton.tsx
//
// Distributes the selected fixtures (3+) evenly along an axis. Opens a
// dropdown with two options: Distribute Horizontal, Distribute Vertical.
// Each is a single-click action.

import React, { useEffect, useRef, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/Application/ConfigureStore';
import {
  selectFixtures,
  selectSelectedFixtureIds,
} from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import {
  repositionFixtures,
} from '@/modules/FixturePlacementStudio/store/fixtureSlice';
import { useFixtureLockState } from '@/modules/FixturePlacementStudio/hooks/useFixtureLockState';

type Axis = 'horizontal' | 'vertical';

const MODES: Array<{ key: Axis; label: string }> = [
  { key: 'horizontal', label: 'Distribute Horizontal' },
  { key: 'vertical',   label: 'Distribute Vertical' },
];

export const DistributeFixturesButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isReadOnly, lockedByUsername } = useFixtureLockState();
  const fixtures = useAppSelector(selectFixtures);
  const selectedIds = useAppSelector(selectSelectedFixtureIds);

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const disabled = isReadOnly || selectedIds.length < 3;

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const apply = (axis: Axis) => {
    if (disabled) return;
    const selected = fixtures.filter((f) => selectedIds.includes(f.id));
    if (selected.length < 3) return;

    const sorted = [...selected].sort((a, b) =>
      axis === 'horizontal' ? a.x - b.x : a.y - b.y
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const step =
      axis === 'horizontal'
        ? (last.x - first.x) / (sorted.length - 1)
        : (last.y - first.y) / (sorted.length - 1);

    const positions = sorted.map((f, i) => ({
      id: f.id,
      x: axis === 'horizontal' ? first.x + step * i : f.x,
      y: axis === 'vertical' ? first.y + step * i : f.y,
    }));

    dispatch(repositionFixtures({ positions }));
    setOpen(false);
  };

  const tooltip = isReadOnly
    ? `Read-only: locked by ${lockedByUsername || 'another user'}`
    : selectedIds.length < 3
    ? 'Select 3+ fixtures (Shift-click) to distribute'
    : 'Distribute selected fixtures';

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        title={tooltip}
        style={{
          ...button,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          border: `1px solid ${disabled ? '#334155' : '#A855F7'}`,
          background: disabled
            ? 'rgba(30, 41, 59, 0.4)'
            : 'rgba(168, 85, 247, 0.12)',
          color: disabled ? '#64748B' : '#C4B5FD',
        }}
      >
        {disabled ? '🔒 Distribute' : '⇹ Distribute ▾'}
      </button>

      {open && !disabled && (
        <div style={menu}>
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => apply(m.key)}
              style={menuItem}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
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

const menu: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: 4,
  background: '#0B0F19',
  border: '1px solid #1E293B',
  borderRadius: 4,
  padding: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  zIndex: 100,
  minWidth: 180,
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
};

const menuItem: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#CBD5E1',
  padding: '4px 8px',
  borderRadius: 3,
  fontSize: 10,
  fontFamily: 'monospace',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background 0.1s, color 0.1s',
};

export default DistributeFixturesButton;