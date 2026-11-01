// src/modules/EmergencyLighting/Dialogs/ExportReportDialog.tsx
//
// Advanced export dialog. Provides controls the toolbar's quick
// ExportGroup dropdown doesn't:
//   • project-name override
//   • section toggles (routes, fixtures, compliance tints)
//   • format picker with per-format description
//
// Calls ExportService.export(format, input, options) and downloads the
// result. Follows AddExitRouteDialog's conventions.

import React, { useMemo, useState } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  selectIssues,
  selectSimStatus,
  selectAllRooms,
  selectEmergencyLightFixtures,
  selectFloorplanModel,
} from '@/modules/EmergencyLighting/store/emergencySelectors';
import {
  ExportService,
  type ExportFormat,
  type EmergencyExportInput,
} from '@/modules/EmergencyLighting/services/ExportService';
import { downloadBlob } from '@/application/downloadBlob';

interface ExportReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const FORMATS: Array<{ value: ExportFormat; label: string; hint: string }> = [
  { value: 'csv',  label: 'CSV',  hint: 'Tabular — one file, three sections (issues, routes, fixtures)' },
  { value: 'json', label: 'JSON', hint: 'Full snapshot — structured, includes summary counts' },
  { value: 'pdf',  label: 'PDF',  hint: 'Print-ready — opens browser print dialog → Save as PDF' },
  { value: 'svg',  label: 'SVG',  hint: 'Vector drawing — rooms, fixtures, routes, tints' },
];

export const ExportReportDialog: React.FC<ExportReportDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const issues   = useAppSelector(selectIssues);
  const simStatus = useAppSelector(selectSimStatus);
  const rooms    = useAppSelector(selectAllRooms);
  const fixtures = useAppSelector(selectEmergencyLightFixtures);
  const model    = useAppSelector(selectFloorplanModel);
  const routes   = useAppSelector((s: any) => s.emergency.routes ?? []);

  const [format, setFormat]               = useState<ExportFormat>('csv');
  const [projectName, setProjectName]     = useState<string>(model?.documentName ?? '');
  const [includeRoutes, setIncludeRoutes] = useState(true);
  const [includeFixtures, setIncludeFixtures] = useState(true);
  const [includeTints, setIncludeTints]   = useState(true);
  const [busy, setBusy]                   = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const isSvg = format === 'svg';
  const hasModel = !!model;

  const input: EmergencyExportInput = useMemo(
    () => ({
      issues,
      simulationStatus: simStatus,
      rooms,
      routes,
      fixtures,
      elements: model?.elements,
      documentName: model?.documentName,
      projectName: projectName.trim() || undefined,
    }),
    [issues, simStatus, rooms, routes, fixtures, model, projectName]
  );

  if (!isOpen) return null;

  const onExport = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await ExportService.export(format, input, {
        includeRoutes,
        includeFixtures,
        includeComplianceTints: includeTints,
        projectName: projectName.trim() || undefined,
      });
      downloadBlob(result.content, result.fileName, result.mimeType);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warnCount  = issues.filter((i) => i.severity === 'warning').length;
  const infoCount  = issues.filter((i) => i.severity === 'info').length;

  const Checkbox: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }> = ({ checked, onChange, label, disabled }) => (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 11,
        color: disabled ? '#475569' : '#E2E8F0',
        cursor: disabled ? 'not-allowed' : 'pointer',
        marginBottom: 6,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: '#38BDF8', cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
      {label}
    </label>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0F1424',
          border: '1px solid #1E293B',
          borderRadius: 8,
          padding: 24,
          width: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          fontFamily: 'monospace',
          color: '#E2E8F0',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: '#38BDF8', fontSize: 14, margin: '0 0 4px' }}>
          Export Compliance Report
        </h2>
        <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 16px', lineHeight: 1.5 }}>
          Configure the export, then download. The file lands in your Downloads folder.
        </p>

        {/* ── Project name ── */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>
            Project name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={model?.documentName ?? 'Untitled Project'}
            disabled={!hasModel}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: '#0B0F19',
              border: '1px solid #334155',
              color: '#E2E8F0',
              padding: '6px 10px',
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: 11,
              outline: 'none',
            }}
          />
        </div>

        {/* ── Format picker ── */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>
            Format
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {FORMATS.map((f) => {
              const active = f.value === format;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFormat(f.value)}
                  style={{
                    background: active ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.05)',
                    border: `1px solid ${active ? '#38BDF8' : '#334155'}`,
                    color: active ? '#38BDF8' : '#94A3B8',
                    padding: '8px 6px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 'bold',
                  }}
                  title={f.hint}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 10, color: '#64748B', margin: '6px 0 0', lineHeight: 1.4 }}>
            {FORMATS.find((f) => f.value === format)?.hint}
          </p>
        </div>

        {/* ── Options ── */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>
            Include
          </label>
          <Checkbox checked={includeRoutes}   onChange={setIncludeRoutes}   label="Evacuation routes" />
          <Checkbox checked={includeFixtures} onChange={setIncludeFixtures} label="Emergency fixture inventory" />
          <Checkbox
            checked={includeTints}
            onChange={setIncludeTints}
            label="Compliance tints on SVG floorplan"
            disabled={!isSvg}
          />
        </div>

        {/* ── Preview summary ── */}
        <div
          style={{
            background: 'rgba(56,189,248,0.05)',
            border: '1px solid #334155',
            borderRadius: 4,
            padding: 12,
            marginBottom: 16,
            fontSize: 11,
            color: '#94A3B8',
            lineHeight: 1.6,
          }}
        >
          <div style={{ color: '#E2E8F0', fontWeight: 'bold', marginBottom: 4 }}>
            Export preview
          </div>
          <div>
            {issues.length} issue{issues.length === 1 ? '' : 's'} (
            <span style={{ color: '#EF4444' }}>{errorCount} error</span>,{' '}
            <span style={{ color: '#F59E0B' }}>{warnCount} warning</span>,{' '}
            <span style={{ color: '#38BDF8' }}>{infoCount} info</span>)
          </div>
          <div>
            {rooms.length} room{rooms.length === 1 ? '' : 's'} · {routes.length} route
            {routes.length === 1 ? '' : 's'} · {fixtures.length} emergency fixture
            {fixtures.length === 1 ? '' : 's'}
          </div>
        </div>

        {error && (
          <p style={{ fontSize: 11, color: '#EF4444', marginBottom: 12 }}>
            ⚠ {error}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              color: '#94A3B8',
              padding: '6px 12px',
              borderRadius: 4,
              cursor: busy ? 'not-allowed' : 'pointer',
              fontSize: 11,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onExport}
            disabled={busy || !hasModel}
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10B981',
              color: '#10B981',
              padding: '6px 12px',
              borderRadius: 4,
              cursor: busy ? 'wait' : !hasModel ? 'not-allowed' : 'pointer',
              fontSize: 11,
              fontWeight: 'bold',
              opacity: busy || !hasModel ? 0.6 : 1,
            }}
          >
            {busy ? '⏳ Exporting…' : `Export ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportReportDialog;