// src/modules/EmergencyLighting/Toolbar/buttons/ExportReportButton.tsx
//
// One option in the export dropdown. Renders a menu-row style button
// that fires ExportService.export(format, input) for a single format
// and downloads the resulting file.
//
// Not rendered directly in the toolbar — see ExportGroup.tsx, which
// hosts the dropdown and renders one ExportReportButton per format.
//
// Reads Redux via the same selectors the export service expects; the
// caller (ExportGroup) supplies the assembled EmergencyExportInput so
// this component stays format-focused.

import React, { useCallback, useState } from 'react';
import {
  ExportService,
  type ExportFormat,
  type EmergencyExportInput,
} from '@/modules/EmergencyLighting/services/ExportService';
import { downloadBlob } from '@/Application/downloadBlob';

interface ExportReportButtonProps {
  format: ExportFormat;
  input: EmergencyExportInput;
  label: string;
  /** Called after a successful download, so the parent can close the menu. */
  onExported?: () => void;
}

export const ExportReportButton: React.FC<ExportReportButtonProps> = ({
  format,
  input,
  label,
  onExported,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await ExportService.export(format, input);
      downloadBlob(result.content, result.fileName, result.mimeType);
      onExported?.();
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }, [format, input, onExported]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={error ?? label}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: busy ? 'rgba(56,189,248,0.1)' : 'transparent',
        border: 'none',
        color: error ? '#EF4444' : busy ? '#38BDF8' : '#E2E8F0',
        padding: '6px 12px',
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 'bold',
        cursor: busy ? 'wait' : 'pointer',
        opacity: busy ? 0.6 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {busy ? '⏳ Exporting…' : label}
    </button>
  );
};

export default ExportReportButton;