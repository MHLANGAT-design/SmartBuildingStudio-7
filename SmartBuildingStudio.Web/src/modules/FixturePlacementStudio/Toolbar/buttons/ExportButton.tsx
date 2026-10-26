// src/modules/FixturePlacementStudio/Toolbar/buttons/ExportButton.tsx
//
// Exports the current layout in the selected format. Format selection
// is a small dropdown next to the button; the choice persists across
// renders in the session (local state).

import React, { useState } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import { selectLayout } from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import {
  ExportService,
  type ExportFormat,
} from '@/modules/FixturePlacementStudio/services/ExportService';
import { downloadExport } from '@/modules/FixturePlacementStudio/services/ExportDownload';

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'pdf', label: 'PDF' },
  { value: 'dxf', label: 'DXF' },
];

export const ExportButton: React.FC = () => {
  const layout = useAppSelector(selectLayout);
  const [format, setFormat] = useState<ExportFormat>('json');
  const [busy, setBusy] = useState(false);

  const disabled = !layout || busy;

  const handleExport = async () => {
    if (!layout || busy) return;
    setBusy(true);
    try {
      const result = await ExportService.export(format, layout, {
        includeZones: true,
      });
      downloadExport(result);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ExportButton] Export failed:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={wrap}>
      <button
        type="button"
        onClick={handleExport}
        disabled={disabled}
        title={`Export layout as ${format.toUpperCase()}`}
        style={{
          ...button,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {busy ? '📤 Exporting…' : '📤 Export'}
      </button>
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as ExportFormat)}
        disabled={busy}
        title="Export format"
        style={select}
      >
        {FORMATS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const wrap: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
};

const button: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: '4px 0 0 4px',
  border: '1px solid #1E293B',
  borderRight: 'none',
  background: 'rgba(30, 41, 59, 0.4)',
  color: '#94A3B8',
  fontSize: 11,
  fontFamily: 'monospace',
  transition: 'background 0.1s, border-color 0.1s, color 0.1s',
};

const select: React.CSSProperties = {
  padding: '4px 6px',
  borderRadius: '0 4px 4px 0',
  border: '1px solid #1E293B',
  background: '#0B0F19',
  color: '#94A3B8',
  fontSize: 11,
  fontFamily: 'monospace',
  cursor: 'pointer',
  outline: 'none',
};

export default ExportButton;