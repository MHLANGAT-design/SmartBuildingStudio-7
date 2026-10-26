// src/modules/FixturePlacementStudio/Toolbar/buttons/RedoButton.tsx
//
// Redo the last undone layout mutation. Mirror of UndoButton — same
// pattern, opposite history method.

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { setLayout } from '@/modules/FixturePlacementStudio/store/fixtureSlice';
import {
  selectDocumentId,
  selectLayout,
} from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import { SessionRegistry } from '@/modules/FixturePlacementStudio/store/SessionRegistry';

export const RedoButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const documentId = useAppSelector(selectDocumentId);
  const layout = useAppSelector(selectLayout);

  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    const session = documentId ? SessionRegistry.get(documentId) : null;
    setCanRedo(!!session?.history?.canRedo?.());
  }, [documentId, layout]);

  const disabled = !canRedo || !layout;

  const handleClick = () => {
    if (disabled || !documentId) return;

    const session = SessionRegistry.get(documentId);
    if (!session?.history) return;

    const restored = session.history.redo();
    if (!restored) return;

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
      title="Redo last undone change (Ctrl+Y)"
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
      ↪ Redo
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

export default RedoButton;