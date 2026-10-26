// src/modules/FixturePlacementStudio/Toolbar/buttons/UndoButton.tsx
//
// Undo the last layout mutation.
//
// The FixtureHistory instance lives in the SessionRegistry, keyed by
// the current documentId. It's not in Redux (it's a class). We read it
// here, call .undo(), and dispatch the resulting snapshot back through
// setLayout, which updates the slice's layout and re-marks it dirty.
//
// FixtureHistory.undo() returns null when the stack is empty — the
// button is disabled in that case, so we rarely hit the null branch,
// but we still guard.

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { setLayout } from '@/modules/FixturePlacementStudio/store/fixtureSlice';
import {
  selectDocumentId,
  selectLayout,
} from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import { SessionRegistry } from '@/modules/FixturePlacementStudio/store/SessionRegistry';

export const UndoButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const documentId = useAppSelector(selectDocumentId);
  const layout = useAppSelector(selectLayout);

  // Mirror the history stack depth so the button enables/disables
  // correctly. History is a class instance, so there's no selector for
  // it — we re-read on every layout change.
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    const session = documentId ? SessionRegistry.get(documentId) : null;
    setCanUndo(!!session?.history?.canUndo?.());
  }, [documentId, layout]);

  const disabled = !canUndo || !layout;

  const handleClick = () => {
    if (disabled || !documentId) return;

    const session = SessionRegistry.get(documentId);
    if (!session?.history) return;

    const restored = session.history.undo();
    if (!restored) return;

    // The history returns a fresh snapshot of fixtures + zones. Wrap it
    // in the existing layout object so metadata (documentId, revision,
    // name) survives the round-trip.
    dispatch(
      setLayout({
        layout: {
          ...layout,
          fixtures: restored.fixtures,
          zones: restored.zones,
          dirty: true,
        },
      })
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title="Undo last change (Ctrl+Z)"
      style={{
        ...button,
        background: disabled
          ? 'rgba(30, 41, 59, 0.4)'
          : 'rgba(56, 189, 248, 0.12)',
        borderColor: disabled ? '#1E293B' : '#38BDF8',
        color: disabled ? '#475569' : '#7DD3FC',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      ↩ Undo
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

export default UndoButton;