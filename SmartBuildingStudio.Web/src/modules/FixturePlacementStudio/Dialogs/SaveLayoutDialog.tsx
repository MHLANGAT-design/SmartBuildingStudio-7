// src/modules/FixturePlacementStudio/Dialogs/SaveLayoutDialog.tsx
//
// Modal for Save and Save-As.
//
// Two modes:
//   mode="save"    — confirms the current document will be overwritten
//   mode="saveAs"  — prompts for a new layout name
//
// The dialog is a controlled component: it renders nothing unless
// `open` is true, and it calls onConfirm with the chosen name (or
// undefined when mode === 'save') when the user accepts.

import React, { useState, useEffect, useRef } from 'react';

export interface SaveLayoutDialogProps {
  open: boolean;
  mode: 'save' | 'saveAs';
  /** Pre-filled name when mode === 'saveAs'. */
  initialName?: string;
  /** The name of the currently loaded document (used in the save mode confirmation). */
  currentName?: string;
  /** Disable the confirm button while a save is in flight. */
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (name?: string) => void;
}

export const SaveLayoutDialog: React.FC<SaveLayoutDialogProps> = ({
  open,
  mode,
  initialName,
  currentName,
  busy = false,
  onCancel,
  onConfirm,
}) => {
  const [name, setName] = useState(initialName ?? '');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset the field whenever the dialog opens for a new save-as.
  useEffect(() => {
    if (!open) return;
    if (mode === 'saveAs') {
      setName(initialName ?? currentName ?? '');
    }
  }, [open, mode, initialName, currentName]);

  // Focus the input on open for save-as.
  useEffect(() => {
    if (open && mode === 'saveAs') {
      const t = setTimeout(() => inputRef.current?.select(), 40);
      return () => clearTimeout(t);
    }
  }, [open, mode]);

  // Escape cancels.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        e.preventDefault();
        onCancel();
      }
      if (e.key === 'Enter' && !busy) {
        e.preventDefault();
        handleConfirm();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, busy, mode, name]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const trimmed = name.trim();
  const canConfirm = mode === 'save' ? true : trimmed.length > 0;

  const handleConfirm = () => {
    if (busy) return;
    if (mode === 'save') {
      onConfirm();
    } else {
      if (!trimmed) return;
      onConfirm(trimmed);
    }
  };

  return (
    <div style={backdrop} onClick={() => !busy && onCancel()}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          {mode === 'save' ? 'Save layout' : 'Save layout as'}
        </div>

        {mode === 'save' ? (
          <div style={body}>
            <div style={{ fontSize: 12, color: '#CBD5E1' }}>
              Overwrite the current layout
              {currentName ? (
                <>
                  {': '}
                  <strong style={{ color: '#7DD3FC' }}>{currentName}</strong>
                </>
              ) : null}
              ?
            </div>
          </div>
        ) : (
          <div style={body}>
            <label style={label}>New name</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              placeholder="Layout name"
              style={input}
            />
          </div>
        )}

        <div style={footer}>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={{ ...button, ...buttonGhost }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || busy}
            style={{
              ...button,
              ...buttonPrimary,
              opacity: !canConfirm || busy ? 0.5 : 1,
              cursor: !canConfirm || busy ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const backdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  zIndex: 9000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const panel: React.CSSProperties = {
  width: 360,
  maxWidth: '90vw',
  background: '#0F172A',
  border: '1px solid #1E293B',
  borderRadius: 8,
  boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
  overflow: 'hidden',
  fontFamily: 'monospace',
  color: '#E2E8F0',
};

const header: React.CSSProperties = {
  padding: '10px 14px',
  background: '#0B0F19',
  borderBottom: '1px solid #1E293B',
  fontSize: 11,
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#7DD3FC',
};

const body: React.CSSProperties = {
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const label: React.CSSProperties = {
  fontSize: 10,
  color: '#94A3B8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const input: React.CSSProperties = {
  padding: '6px 10px',
  background: '#0B0F19',
  border: '1px solid #1E293B',
  borderRadius: 4,
  color: '#E2E8F0',
  fontFamily: 'monospace',
  fontSize: 12,
  outline: 'none',
};

const footer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  padding: '10px 14px',
  background: '#0B0F19',
  borderTop: '1px solid #1E293B',
};

const button: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 4,
  border: '1px solid transparent',
  fontFamily: 'monospace',
  fontSize: 11,
  fontWeight: 'bold',
  transition: 'background 0.1s, border-color 0.1s, color 0.1s',
};

const buttonGhost: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #334155',
  color: '#94A3B8',
  cursor: 'pointer',
};

const buttonPrimary: React.CSSProperties = {
  background: 'rgba(16, 185, 129, 0.15)',
  border: '1px solid #10B981',
  color: '#6EE7B7',
  cursor: 'pointer',
};

export default SaveLayoutDialog;