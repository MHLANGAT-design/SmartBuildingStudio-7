// src/modules/FixturePlacementStudio/Dialogs/ImportFixtureDialog.tsx
//
// File picker + preview + Import button for the import-fixtures flow.
//
// The dialog does no parsing itself. It reads the selected file as
// text, parses it to check basic shape for the preview, then passes
// the raw parsed object to the importFixturesThunk on Import. The
// thunk re-parses and does the real work.

import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { importFixturesThunk } from '@/modules/FixturePlacementStudio/store/fixtureThunks';
import { selectDocumentId } from '@/modules/FixturePlacementStudio/store/fixtureSelectors';

export interface ImportFixtureDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful import, with a summary for a toast. */
  onImported?: (summary: {
    importedFixtures: number;
    importedZones: number;
  }) => void;
}

interface PreviewSummary {
  documentId: string;
  fixtureCount: number;
  zoneCount: number;
  documentIdMismatch: boolean;
  parsed: unknown;
}

export const ImportFixtureDialog: React.FC<ImportFixtureDialogProps> = ({
  open,
  onClose,
  onImported,
}) => {
  const dispatch = useAppDispatch();
  const currentDocumentId = useAppSelector(selectDocumentId);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  // Reset on open.
  useEffect(() => {
    if (open) {
      setFileName(null);
      setPreview(null);
      setError(null);
      setImporting(false);
    }
  }, [open]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !importing) {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, importing, onClose]);

  if (!open) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setPreview(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('File does not contain a JSON object.');
      }
      if (!Array.isArray((parsed as any).fixtures)) {
        throw new Error('File is missing a "fixtures" array.');
      }

      const documentId = String((parsed as any).documentId ?? '');
      const fixtureCount = (parsed as any).fixtures.length;
      const zoneCount = Array.isArray((parsed as any).zones)
        ? (parsed as any).zones.length
        : 0;

      setPreview({
        documentId,
        fixtureCount,
        zoneCount,
        documentIdMismatch: !!documentId && documentId !== currentDocumentId,
        parsed,
      });
    } catch (err: any) {
      setError(err?.message ?? 'Could not parse the file.');
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const summary = await dispatch(importFixturesThunk(preview.parsed) as any);
      onImported?.(summary);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={backdrop} onClick={() => !importing && onClose()}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={header}>Import fixtures</div>

        <div style={body}>
          <div style={{ fontSize: 11, color: '#CBD5E1' }}>
            Select a JSON file previously exported from Fixture Place.
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={importing}
            style={picker}
          >
            {fileName ? `📄 ${fileName}` : '📂 Choose file…'}
          </button>

          {error && <div style={errorBox}>{error}</div>}

          {preview && !error && (
            <div style={previewBox}>
              <div style={previewLine}>
                <strong>Fixtures:</strong> {preview.fixtureCount}
              </div>
              <div style={previewLine}>
                <strong>Zones:</strong> {preview.zoneCount}
              </div>
              {preview.documentId && (
                <div style={previewLine}>
                  <strong>Source document:</strong>{' '}
                  <span style={{ fontSize: 9, color: '#94A3B8' }}>
                    {preview.documentId}
                  </span>
                </div>
              )}
              {preview.documentIdMismatch && (
                <div style={warnBox}>
                  ⚠ This file was exported from a different document. Fixture
                  ids will be regenerated and the fixtures will be merged into
                  the current layout.
                </div>
              )}
            </div>
          )}
        </div>

        <div style={footer}>
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            style={buttonGhost}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!preview || importing}
            style={{
              ...buttonPrimary,
              opacity: !preview || importing ? 0.4 : 1,
              cursor: !preview || importing ? 'not-allowed' : 'pointer',
            }}
          >
            {importing ? 'Importing…' : 'Import'}
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
  width: 420,
  maxWidth: '92vw',
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
  gap: 10,
};

const picker: React.CSSProperties = {
  padding: '10px 14px',
  border: '1px dashed #334155',
  borderRadius: 4,
  background: 'transparent',
  color: '#94A3B8',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: 11,
  textAlign: 'left',
};

const errorBox: React.CSSProperties = {
  padding: '8px 10px',
  background: 'rgba(239, 68, 68, 0.08)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: 4,
  fontSize: 10,
  color: '#FCA5A5',
};

const warnBox: React.CSSProperties = {
  marginTop: 6,
  padding: '6px 8px',
  background: 'rgba(245, 158, 11, 0.08)',
  border: '1px solid rgba(245, 158, 11, 0.3)',
  borderRadius: 4,
  fontSize: 10,
  color: '#FCD34D',
  lineHeight: 1.4,
};

const previewBox: React.CSSProperties = {
  padding: '8px 10px',
  background: '#0B1220',
  border: '1px solid #1E293B',
  borderRadius: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const previewLine: React.CSSProperties = {
  fontSize: 10,
  color: '#CBD5E1',
};

const footer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  padding: '10px 14px',
  background: '#0B0F19',
  borderTop: '1px solid #1E293B',
};

const buttonGhost: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 4,
  border: '1px solid #334155',
  background: 'transparent',
  color: '#94A3B8',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: 11,
  fontWeight: 'bold',
};

const buttonPrimary: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 4,
  border: '1px solid #10B981',
  background: 'rgba(16, 185, 129, 0.15)',
  color: '#6EE7B7',
  fontFamily: 'monospace',
  fontSize: 11,
  fontWeight: 'bold',
};

export default ImportFixtureDialog;