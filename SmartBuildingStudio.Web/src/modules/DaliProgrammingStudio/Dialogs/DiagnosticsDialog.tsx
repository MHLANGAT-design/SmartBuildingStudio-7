// src/modules/DaliProgrammingStudio/Dialogs/DiagnosticsDialog.tsx

import React from 'react';
import { Modal, Footer } from '@/modules/DaliProgrammingStudio/Dialogs/LoadDesignDialog';
import type { DiagnosticsReport } from '@/modules/DaliProgrammingStudio/Diagnostics/DiagnosticsReport';
import { DIAGNOSTIC_SEVERITY } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  report: DiagnosticsReport | null;
}

export const DiagnosticsDialog: React.FC<Props> = ({ isOpen, onClose, report }) => {
  if (!isOpen || !report) return null;

  return (
    <Modal onClose={onClose} title="Diagnostics Report">
      <div style={{ 
        padding: 10, 
        background: report.isHealthy ? '#143021' : '#3F1D1D', 
        border: `1px solid ${report.isHealthy ? '#4ADE80' : '#F87171'}`,
        borderRadius: 4, marginBottom: 12, textAlign: 'center',
      }}>
        <div style={{ color: report.isHealthy ? '#4ADE80' : '#F87171', fontWeight: 'bold', fontSize: 12 }}>
          {report.isHealthy ? '✓ Network Healthy' : `⚠ ${report.summary.totalIssues} Issue(s) Detected`}
        </div>
      </div>

      <div style={{ maxHeight: 300, overflow: 'auto' }}>
        {report.issues.map(issue => {
          const color = issue.severity === DIAGNOSTIC_SEVERITY.CRITICAL ? '#F87171' 
            : issue.severity === DIAGNOSTIC_SEVERITY.ERROR ? '#FB923C' 
            : issue.severity === DIAGNOSTIC_SEVERITY.WARNING ? '#FBBF24' : '#60A5FA';
          return (
            <div
              key={issue.issueId}
              style={{
                padding: 8, marginBottom: 6,
                background: '#0A0F1E',
                border: `1px solid ${color}40`,
                borderRadius: 4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ color, fontSize: 10, fontWeight: 'bold' }}>{issue.severity}</span>
                <span style={{ color: '#64748B', fontSize: 9, fontFamily: 'monospace' }}>{issue.code}</span>
              </div>
              <div style={{ color: '#E5E7EB', fontSize: 10, marginBottom: 2 }}>{issue.message}</div>
              {issue.recommendedAction && (
                <div style={{ color: '#64748B', fontSize: 9 }}>→ {issue.recommendedAction}</div>
              )}
            </div>
          );
        })}
      </div>

      <Footer onCancel={onClose} onConfirm={onClose} confirmLabel="Close" />
    </Modal>
  );
};