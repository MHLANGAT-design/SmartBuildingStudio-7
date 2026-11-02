// src/modules/FixturePlacementStudio/Toolbar/FixtureToolbar.tsx
//
// Toolbar host for FixturePlacementStudio.
//
// Three rows:
//   Row 1 — File / Edit / Place (structural actions)
//   Row 2 — Analysis / DALI / status (evaluation + state)
//   Row 3 — View toggles (layer visibility)
//
// Each row wraps internally so narrow widths don't clip buttons, but
// the three rows are always present (no reflow between rows).

import React from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  selectSaveStatus,
  selectSaveError,
  selectIsDirty,
  selectLatestPhotometricCalculation,
  selectIsCalculating,
} from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import { useFixtureLockState } from '@/modules/FixturePlacementStudio/hooks/useFixtureLockState';
import { OpenDaliDesignerButton } from '@/modules/FixturePlacementStudio/Toolbar/buttons/OpenDaliDesignerButton';
import { FileGroup } from '@/modules/FixturePlacementStudio/Toolbar/groups/FileGroup';
import { EditGroup } from '@/modules/FixturePlacementStudio/Toolbar/groups/EditGroup';
import { PlaceGroup } from '@/modules/FixturePlacementStudio/Toolbar/groups/PlaceGroup';
import { AnalysisGroup } from '@/modules/FixturePlacementStudio/Toolbar/groups/AnalysisGroup';
import { ViewGroup } from '@/modules/FixturePlacementStudio/Toolbar/groups/ViewGroup';

export const FixtureToolbar: React.FC = () => {
  const saveStatus = useAppSelector(selectSaveStatus);
  const saveError = useAppSelector(selectSaveError);
  const isDirty = useAppSelector(selectIsDirty);

  const isCalculating = useAppSelector(selectIsCalculating);
  const latestPhotometric = useAppSelector(selectLatestPhotometricCalculation);

  const { isReadOnly, lockedByUsername } = useFixtureLockState();

  const avgLux =
    latestPhotometric?.result &&
    'averageLux' in latestPhotometric.result
      ? (latestPhotometric.result as any).averageLux
      : null;

  return (
    <div style={toolbarRoot}>
      {/* ── Row 1: structural actions ───────────────────────────── */}
      <div style={row}>
        <FileGroup />
        <span style={divider}>|</span>
        <EditGroup />
        <span style={divider}>|</span>
        <PlaceGroup />
      </div>

      {/* ── Row 2: evaluation + external entry point + state ────── */}
      <div style={row}>
        <AnalysisGroup />
        <span style={divider}>|</span>
        <OpenDaliDesignerButton />

        {avgLux != null && !isCalculating && (
          <span style={readout}>
            avg{' '}
            <strong style={{ color: '#7DD3FC' }}>{Math.round(avgLux)}</strong>{' '}
            lx
          </span>
        )}

        {isReadOnly && (
          <span
            style={readOnlyBadge}
            title={`Locked by ${lockedByUsername || 'another user'}`}
          >
            🔒 READ-ONLY
          </span>
        )}

        {!isReadOnly && saveStatus === 'saved' && !isDirty && (
          <span style={statusOk}>Saved</span>
        )}
        {saveStatus === 'conflict' && (
          <span style={statusErr}>Conflict — reload to sync</span>
        )}
        {saveStatus === 'error' && (
          <span style={statusErr}>{saveError ?? 'Save failed'}</span>
        )}
      </div>

      {/* ── Row 3: view toggles ─────────────────────────────────── */}
      <div style={row}>
        <span style={viewLabel}>VIEW</span>
        <ViewGroup />
      </div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const toolbarRoot: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  width: '100%',
  minWidth: 0,
};

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 8,
  rowGap: 4,
  minWidth: 0,
};

const viewLabel: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 'bold',
  color: '#475569',
  letterSpacing: 1,
  fontFamily: 'monospace',
};

const divider: React.CSSProperties = {
  color: '#334155',
  fontSize: 11,
  userSelect: 'none',
};

const readout: React.CSSProperties = {
  fontSize: 10,
  color: '#94A3B8',
  fontFamily: 'monospace',
  padding: '0 4px',
};

const statusOk: React.CSSProperties = {
  fontSize: 10,
  color: '#10B981',
  fontFamily: 'monospace',
  marginLeft: 4,
};

const statusErr: React.CSSProperties = {
  fontSize: 10,
  color: '#EF4444',
  fontFamily: 'monospace',
  marginLeft: 4,
};

const readOnlyBadge: React.CSSProperties = {
  fontSize: 10,
  fontFamily: 'monospace',
  fontWeight: 'bold',
  color: '#FFB800',
  background: 'rgba(255, 184, 0, 0.12)',
  border: '1px solid rgba(255, 184, 0, 0.4)',
  borderRadius: 4,
  padding: '3px 8px',
  letterSpacing: '0.05em',
};

export default FixtureToolbar;