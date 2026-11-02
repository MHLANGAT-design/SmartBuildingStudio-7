// src/modules/EmergencyLighting/Dialogs/ComplianceReportDialog.tsx
//
// Preview dialog for the compliance report. Renders the same HTML the
// PDF export produces (via ExportService.toPdf) inside an <iframe>, so
// the user sees exactly what will be printed before committing to a
// download. "Download" saves the HTML; opening it in a browser and
// using "Save as PDF" produces the PDF.
//
// Not currently wired to Redux — local state in the host. Open via a
// "Preview report" action anywhere; use <ComplianceReportDialog
// isOpen={...} onClose={...} /> pattern.
//
// Follows the same conventions as AddExitRouteDialog.

import React, { useMemo } from 'react';
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
  type EmergencyExportInput,
} from '@/modules/EmergencyLighting/services/ExportService';
import { downloadBlob } from '@/Application/downloadBlob';

interface ComplianceReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComplianceReportDialog: React.FC<ComplianceReportDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const issues    = useAppSelector(selectIssues);
  const simStatus = useAppSelector(selectSimStatus);
  const rooms     = useAppSelector(selectAllRooms);
  const fixtures  = useAppSelector(selectEmergencyLightFixtures);
  const model     = useAppSelector(selectFloorplanModel);
  const routes    = useAppSelector((s: any) => s.emergency.routes ?? []);

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

  // Build the report HTML once per open. ExportService.toPdf is
  // synchronous — no async state needed for the preview.
  const reportHtml = useMemo(() => {
    if (!isOpen) return '';
    try {
      const result = ExportService.export('pdf', input);
      // ExportService.export is async but resolves synchronously for 'pdf'
      // (no I/O). Safest pattern: await, but since the preview renders
      // on first paint, we synchronously build via a helper instead.
      return '';
    } catch {
      return '';
    }
  }, [isOpen, input]);

  // Because export() is async, render the preview from a direct call
  // below via a small effect.
  const [html, setHtml] = React.useState<string>('');
  React.useEffect(() => {
    if (!isOpen) { setHtml(''); return; }
    let cancelled = false;
    ExportService.export('pdf', input).then((result) => {
      if (cancelled) return;
      if (typeof result.content === 'string') setHtml(result.content);
    });
    return () => { cancelled = true; };
  }, [isOpen, input]);

  if (!isOpen) return null;

  const isSimComplete = simStatus === 'complete';
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warnCount  = issues.filter((i) => i.severity === 'warning').length;
  const infoCount  = issues.filter((i) => i.severity === 'info').length;

  const onDownload = async () => {
    const result = await ExportService.export('pdf', input);
    downloadBlob(result.content, result.fileName, result.mimeType);
    onClose();
  };

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
          width: 'min(900px, 92vw)',
          height: 'min(760px, 92vh)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'monospace',
          color: '#E2E8F0',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: '#38BDF8', fontSize: 14, margin: '0 0 4px' }}>
          Compliance Report Preview
        </h2>

        <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 12px', lineHeight: 1.5 }}>
          {isSimComplete ? (
            <>
              Preview of the report that will be exported. {issues.length} issue
              {issues.length === 1 ? '' : 's'} (
              <span style={{ color: '#EF4444' }}>{errorCount} error</span>,{' '}
              <span style={{ color: '#F59E0B' }}>{warnCount} warning</span>,{' '}
              <span style={{ color: '#38BDF8' }}>{infoCount} info</span>)
            </>
          ) : (
            <>
              ⚠ Simulation has not completed yet. Run a simulation first to
              produce the report.
            </>
          )}
        </p>

        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            border: '1px solid #334155',
            borderRadius: 4,
            background: '#fff',
            marginBottom: 16,
          }}
        >
          {html ? (
            <iframe
              title="Compliance Report Preview"
              srcDoc={html}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
              sandbox=""
            />
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B',
                fontSize: 11,
              }}
            >
              {isSimComplete ? 'Building preview…' : 'No simulation results to preview'}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              color: '#94A3B8',
              padding: '6px 12px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            Close
          </button>
          <button
            onClick={onDownload}
            disabled={!isSimComplete || !html}
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid #10B981',
              color: '#10B981',
              padding: '6px 12px',
              borderRadius: 4,
              cursor: !isSimComplete || !html ? 'not-allowed' : 'pointer',
              fontSize: 11,
              fontWeight: 'bold',
              opacity: !isSimComplete || !html ? 0.5 : 1,
            }}
          >
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComplianceReportDialog;