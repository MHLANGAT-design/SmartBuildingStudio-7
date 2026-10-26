// src/modules/FixturePlacementStudio/Toolbar/buttons/ImportFixturesButton.tsx
//
// Opens the import dialog. The dialog handles file reading, preview,
// and dispatch; this button only controls the open flag.

import React, { useState } from 'react';
import { ImportFixtureDialog } from '@/modules/FixturePlacementStudio/Dialogs/ImportFixtureDialog';

export const ImportFixturesButton: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Import fixtures from a JSON file"
        style={button}
      >
        📥 Import
      </button>
      <ImportFixtureDialog open={open} onClose={() => setOpen(false)} />
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

export default ImportFixturesButton;