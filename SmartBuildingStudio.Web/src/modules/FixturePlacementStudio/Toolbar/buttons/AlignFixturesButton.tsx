// src/modules/FixturePlacementStudio/Toolbar/buttons/AlignFixturesButton.tsx
//
// Aligns the selected fixtures (2+) along an axis. Opens a dropdown
// with four alignment modes:
//   • Align Left   — min x
//   • Align Right  — max x
//   • Align Top    — max y
//   • Align Bottom — min y
//   • Center X     — average x
//   • Center Y     — average y
// Each option is a single-click action; no compounding.

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

type AlignMode = 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY';

const MODES: Array<{ key: AlignMode; label: string }> = [
  { key: 'left',    label: 'Align Left' },
  { key: 'right',   label: 'Align Right' },
  { key: 'top',     label: 'Align Top' },
  { key: 'bottom',  label: 'Align Bottom' },
  { key: 'centerX', label: 'Center X' },
  { key: 'centerY', label: 'Center Y' },
];

export const AlignFixturesButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isReadOnly, lockedByUsername } = useFixtureLockState();
  const fixtures = useAppSelector(selectFixtures);
  const selectedIds = useAppSelector(selectSelectedFixtureIds);

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const disabled = isReadOnly || selectedIds.length < 2;

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

  const apply = (mode: AlignMode) => {
    if (disabled) return;
    const selected = fixtures.filter((f) => selectedIds.includes(f.id));
    if (selected.length < 2) return;

    let targetX: number | null = null;
    let targetY: number | null = null;

    switch (mode) {
      case 'left':    targetX = Math.min(...selected.map((f) => f.x)); break;
      case 'right':   targetX = Math.max(...selected.map((f) => f.x)); break;
      case 'top':     targetY = Math.max(...selected.map((f) => f.y)); break;
      case 'bottom':  targetY = Math.min(...selected.map((f) => f.y)); break;
      case 'centerX': targetX = selected.reduce((s, f) => s + f.x, 0) / selected.length; break;
      case 'centerY': targetY = selected.reduce((s, f) => s + f.y, 0) / selected.length; break;
    }

    const positions = selected.map((f) => ({
      id: f.id,
      x: targetX ?? f.x,
      y: targetY ?? f.y,
    }));

    dispatch(repositionFixtures({ positions }));
    setOpen(false);
  };

  const tooltip = isReadOnly
    ? `Read-only: locked by ${lockedByUsername || 'another user'}`
    : selectedIds.length < 2
    ? 'Select 2+ fixtures (Shift-click) to align'
    : 'Align selected fixtures';

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
          border: `1px solid ${disabled ? '#334155' : '#38BDF8'}`,
          background: disabled
            ? 'rgba(30, 41, 59, 0.4)'
            : 'rgba(56, 189, 248, 0.12)',
          color: disabled ? '#64748B' : '#7DD3FC',
        }}
      >
        {disabled ? '🔒 Align' : '⊞ Align ▾'}
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
  minWidth: 140,
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

export default AlignFixturesButton;