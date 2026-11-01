// src/modules/EmergencyLighting/Toolbar/groups/ExportGroup.tsx
//
// Toolbar item: a single "Export ▾" button that reveals
//   • Export CSV / JSON / PDF / SVG   — quick format items, one click
//   • ⚙ Advanced export…              — opens ExportReportDialog
//                                        (project name, section
//                                        toggles, live preview)
//   • 👁 Report preview…              — opens ComplianceReportDialog
//                                        (iframe preview of the
//                                        PDF the export produces)
//
// Follows the same toolbar-item conventions as SimulationGroup.tsx:
//   • no props, reads Redux via useAppSelector
//   • single button with inline styles, monospace 11px bold, radius 4
//   • disabled reflects whether the floorplan has loaded
//
// The dropdown is a small absolutely-positioned panel below the button;
// clicking elsewhere closes it.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  selectIssues,
  selectSimStatus,
  selectAllRooms,
  selectEmergencyLightFixtures,
  selectFloorplanModel,
} from '@/modules/EmergencyLighting/store/emergencySelectors';
import { ExportReportButton } from '@/modules/EmergencyLighting/Toolbar/buttons/ExportReportButton';
import { ExportReportDialog } from '@/modules/EmergencyLighting/Dialogs/ExportReportDialog';
import { ComplianceReportDialog } from '@/modules/EmergencyLighting/Dialogs/ComplianceReportDialog';
import type {
  ExportFormat,
  EmergencyExportInput,
} from '@/modules/EmergencyLighting/services/ExportService';

export const ExportGroup: React.FC = () => {
  const issues    = useAppSelector(selectIssues);
  const simStatus = useAppSelector(selectSimStatus);
  const rooms     = useAppSelector(selectAllRooms);
  const fixtures  = useAppSelector(selectEmergencyLightFixtures);
  const model     = useAppSelector(selectFloorplanModel);
  const routes    = useAppSelector((s: any) => s.emergency.routes ?? []);

  const [open, setOpen]               = useState(false);
  const [advOpen, setAdvOpen]         = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const input: EmergencyExportInput = useMemo(
    () => ({
      issues,
      simulationStatus: simStatus,
      rooms,
      routes,
      fixtures,
      elements: model?.elements,
      documentName: model?.documentName,
    }),
    [issues, simStatus, rooms, routes, fixtures, model]
  );

  const hasModel = !!model;
  const isDisabled = !hasModel;

  const formats: Array<{ format: ExportFormat; label: string }> = [
    { format: 'csv',  label: 'Export CSV'  },
    { format: 'json', label: 'Export JSON' },
    { format: 'pdf',  label: 'Export PDF'  },
    { format: 'svg',  label: 'Export SVG'  },
  ];

  const openAdvanced = () => {
    setOpen(false);
    setAdvOpen(true);
  };

  const openPreview = () => {
    setOpen(false);
    setPreviewOpen(true);
  };

  const MENU_ROW_STYLE: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    border: 'none',
    color: '#E2E8F0',
    padding: '6px 12px',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isDisabled}
        style={{
          background: open ? 'rgba(56,189,248,0.1)' : 'rgba(148,163,184,0.1)',
          border: `1px solid ${open ? '#38BDF8' : '#94A3B8'}`,
          color: open ? '#38BDF8' : '#94A3B8',
          padding: '4px 10px',
          borderRadius: 4,
          fontFamily: 'monospace',
          fontSize: 11,
          fontWeight: 'bold',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.5 : 1,
        }}
        title={!hasModel ? 'Floorplan not loaded' : 'Export compliance report'}
      >
        {open ? '▲ Export' : '▼ Export'}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            minWidth: 180,
            background: 'rgba(11,15,25,0.98)',
            border: '1px solid #334155',
            borderRadius: 4,
            padding: '4px 0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 20,
          }}
        >
          {/* Quick format items */}
          {formats.map(({ format, label }) => (
            <ExportReportButton
              key={format}
              format={format}
              input={input}
              label={label}
              onExported={() => setOpen(false)}
            />
          ))}

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: '#1E293B',
              margin: '4px 0',
            }}
          />

          {/* Advanced export — opens the config dialog */}
          <button
            type="button"
            onClick={openAdvanced}
            style={MENU_ROW_STYLE}
            title="Configure project name, sections, and preview before export"
          >
            ⚙ Advanced export…
          </button>

          {/* Report preview — opens the iframe preview dialog */}
          <button
            type="button"
            onClick={openPreview}
            style={MENU_ROW_STYLE}
            title="Preview the compliance report before downloading"
          >
            👁 Report preview…
          </button>
        </div>
      )}

      {/* Advanced export dialog — project name + toggles + preview */}
      <ExportReportDialog
        isOpen={advOpen}
        onClose={() => setAdvOpen(false)}
      />

      {/* Compliance report preview dialog — iframe of the PDF HTML */}
      <ComplianceReportDialog
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
};

export default ExportGroup;