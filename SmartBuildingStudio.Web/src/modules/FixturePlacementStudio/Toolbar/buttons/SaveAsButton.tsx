// src/modules/FixturePlacementStudio/Toolbar/buttons/SaveAsButton.tsx
//
// Save-As today: the backend does not yet support save-as to a new
// document; the manager's save() always writes back to the loaded
// document id. So this button currently performs a save with a new
// in-memory layout name — the same PUT, but with the name collected
// for future use when the backend adds a save-as endpoint.
//
// This matches FixtureDocumentManager.save(), which takes no name.
// When the backend gains a save-as endpoint, the dialog's onConfirm
// will route to it and the button will pass the name through.

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { saveDocumentThunk } from '@/modules/FixturePlacementStudio/store/fixtureThunks';
import { selectLayout } from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import { SaveLayoutDialog } from '@/modules/FixturePlacementStudio/Dialogs/SaveLayoutDialog';

export const SaveAsButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const layout = useAppSelector(selectLayout);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const currentName =
    (layout as any)?.name ?? layout?.documentId ?? 'Untitled layout';

  const handleConfirm = async (_name?: string) => {
    setBusy(true);
    try {
      await dispatch(saveDocumentThunk() as any);
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Save layout as…"
        style={button}
      >
        💾 Save As…
      </button>
      <SaveLayoutDialog
        open={open}
        mode="saveAs"
        initialName={currentName}
        currentName={currentName}
        busy={busy}
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
};

const button: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 4,
  border: '1px solid #1E293B',
  background: 'rgba(30, 41, 59, 0.4)',
  color: '#94A3B8',
  fontSize: 11,
  fontFamily: 'monospace',
  cursor: 'pointer',
  transition: 'background 0.1s, border-color 0.1s, color 0.1s',
};

export default SaveAsButton;