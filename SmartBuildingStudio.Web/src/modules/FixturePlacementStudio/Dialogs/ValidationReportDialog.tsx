// src/modules/FixturePlacementStudio/Dialogs/ValidationReportDialog.tsx
//
// Modal that renders a ValidationReport.
//
// Two modes:
//   open=false          — renders nothing
//   open=true, report   — renders the report
//
// Groups violations by rule kind so the user sees "5 min-spacing issues"
// rather than 5 separate rows. Within a group, shows each violation's
// message. Collapsible per group is overkill for v1 — flat list is fine
// when the violation count is small, and the groups sort by severity.

import React, { useMemo } from 'react';
import type {
  ValidationReport,
  ValidationViolation,
} from '@/modules/FixturePlacementStudio/services/ValidationService';

export interface ValidationReportDialogProps {
  open: boolean;
  report: ValidationReport | null;
  onClose: () => void;
}

// ─── Severity theming ─────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<string, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

const SEVERITY_COLORS: Record<
  string,
  { fg: string; bg: string; border: string; label: string }
> = {
  error: { fg: '#FCA5A5', bg: 'rgba(239, 68, 68, 0.12)', border: '#EF4444', label: 'Error' },
  warning: { fg: '#FCD34D', bg: 'rgba(245, 158, 11, 0.12)', border: '#F59E0B', label: 'Warning' },
  info: { fg: '#7DD3FC', bg: 'rgba(56, 189, 248, 0.12)', border: '#38BDF8', label: 'Info' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ValidationReportDialog: React.FC<ValidationReportDialogProps> = ({
  open,
  report,
  onClose,
}) => {
  // Sort: errors first, then warnings, then info. Within a severity,
  // group by rule kind so related issues read together.
  const grouped = useMemo(() => {
    if (!report) return [];
    const map = new Map<string, ValidationViolation[]>();
    for (const v of report.violations) {
      const key = `${v.severity}::${v.ruleKind}`;
      const arr = map.get(key) ?? [];
      arr.push(v);
      map.set(key, arr);
    }
    return [...map.entries()]
      .map(([key, violations]) => {
        const [severity, ruleKind] = key.split('::');
        return { severity, ruleKind, violations };
      })
      .sort((a, b) => {
        const s = (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99);
        if (s !== 0) return s;
        return a.ruleKind.localeCompare(b.ruleKind);
      });
  }, [report]);

  // Escape closes.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open || !report) return null;

  const totalViolations =
    report.errorCount + report.warningCount + report.infoCount;

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <span>Validation report</span>
          <span style={{ ...statusBadge, ...(report.passed ? badgePass : badgeFail) }}>
            {report.passed ? 'PASSED' : 'FAILED'}
          </span>
        </div>

        <div style={summaryRow}>
          <SummaryStat label="Errors" count={report.errorCount} color="#FCA5A5" />
          <SummaryStat label="Warnings" count={report.warningCount} color="#FCD34D" />
          <SummaryStat label="Info" count={report.infoCount} color="#7DD3FC" />
          <div style={summarySpacer} />
          <span style={metaText}>
            {new Date(report.generatedAt).toLocaleTimeString()}
          </span>
        </div>

        <div style={body}>
          {totalViolations === 0 ? (
            <div style={emptyState}>
              <div style={{ color: '#6EE7B7', fontSize: 12, fontWeight: 'bold' }}>
                No violations found.
              </div>
              <div style={{ color: '#94A3B8', fontSize: 10, marginTop: 4 }}>
                Layout complies with the loaded rule set.
              </div>
            </div>
          ) : (
            grouped.map((g) => (
              <div key={`${g.severity}::${g.ruleKind}`} style={groupBlock}>
                <div style={{ ...groupHeader, color: SEVERITY_COLORS[g.severity]?.fg ?? '#94A3B8' }}>
                  <span style={severityChip(SEVERITY_COLORS[g.severity])}>
                    {SEVERITY_COLORS[g.severity]?.label ?? g.severity}
                  </span>
                  <strong>{g.ruleKind}</strong>
                  <span style={groupCount}>({g.violations.length})</span>
                </div>
                {g.violations.map((v, i) => (
                  <div key={i} style={violationRow}>
                    <div style={violationMessage}>{v.message}</div>
                    {(v.measured != null || v.required != null) && (
                      <div style={violationMeta}>
                        {v.measured != null && (
                          <span>measured {Number(v.measured).toFixed(2)}</span>
                        )}
                        {v.measured != null && v.required != null && (
                          <span style={metaDivider}> · </span>
                        )}
                        {v.required != null && (
                          <span>required {Number(v.required).toFixed(2)}</span>
                        )}
                      </div>
                    )}
                    {v.fixtureIds.length > 0 && (
                      <div style={violationFixtures}>
                        fixtures: {v.fixtureIds.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div style={footer}>
          <button type="button" onClick={onClose} style={buttonPrimary}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SummaryStat: React.FC<{ label: string; count: number; color: string }> = ({
  label,
  count,
  color,
}) => (
  <span style={{ ...summaryStat, color }}>
    <strong style={{ fontSize: 13 }}>{count}</strong>
    <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>{label}</span>
  </span>
);

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
  width: 560,
  maxWidth: '92vw',
  maxHeight: '80vh',
  background: '#0F172A',
  border: '1px solid #1E293B',
  borderRadius: 8,
  boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'monospace',
  color: '#E2E8F0',
  overflow: 'hidden',
};

const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  background: '#0B0F19',
  borderBottom: '1px solid #1E293B',
  fontSize: 11,
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#7DD3FC',
};

const statusBadge: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: 3,
  fontSize: 10,
  fontWeight: 'bold',
  border: '1px solid',
};

const badgePass: React.CSSProperties = {
  color: '#6EE7B7',
  background: 'rgba(16, 185, 129, 0.12)',
  borderColor: '#10B981',
};

const badgeFail: React.CSSProperties = {
  color: '#FCA5A5',
  background: 'rgba(239, 68, 68, 0.12)',
  borderColor: '#EF4444',
};

const summaryRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '8px 14px',
  borderBottom: '1px solid #1E293B',
  background: '#0B1220',
};

const summaryStat: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: 2,
  fontFamily: 'monospace',
};

const summarySpacer: React.CSSProperties = { flex: 1 };

const metaText: React.CSSProperties = {
  fontSize: 10,
  color: '#64748B',
};

const body: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const emptyState: React.CSSProperties = {
  textAlign: 'center',
  padding: '24px 12px',
};

const groupBlock: React.CSSProperties = {
  border: '1px solid #1E293B',
  borderRadius: 6,
  overflow: 'hidden',
};

const groupHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 10px',
  background: '#0B1220',
  borderBottom: '1px solid #1E293B',
  fontSize: 11,
};

const severityChip = (colors?: { fg: string; bg: string; border: string; label: string }) =>
  ({
    padding: '1px 6px',
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: colors?.fg ?? '#94A3B8',
    background: colors?.bg ?? 'transparent',
    border: `1px solid ${colors?.border ?? '#334155'}`,
  }) as React.CSSProperties;

const groupCount: React.CSSProperties = {
  marginLeft: 'auto',
  color: '#64748B',
  fontSize: 10,
};

const violationRow: React.CSSProperties = {
  padding: '8px 10px',
  borderTop: '1px solid rgba(30, 41, 59, 0.5)',
};

const violationMessage: React.CSSProperties = {
  fontSize: 11,
  color: '#CBD5E1',
  lineHeight: 1.4,
};

const violationMeta: React.CSSProperties = {
  fontSize: 10,
  color: '#64748B',
  marginTop: 3,
};

const metaDivider: React.CSSProperties = {
  color: '#334155',
  margin: '0 4px',
};

const violationFixtures: React.CSSProperties = {
  fontSize: 10,
  color: '#475569',
  marginTop: 2,
  wordBreak: 'break-all',
};

const footer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  padding: '10px 14px',
  background: '#0B0F19',
  borderTop: '1px solid #1E293B',
};

const buttonPrimary: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 4,
  border: '1px solid #38BDF8',
  background: 'rgba(56, 189, 248, 0.15)',
  color: '#7DD3FC',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: 11,
  fontWeight: 'bold',
};

export default ValidationReportDialog;