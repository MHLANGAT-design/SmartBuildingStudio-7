// src/modules/DaliProgrammingStudio/Dialogs/VerificationReportDialog.tsx

import React from 'react';
import { Modal, Footer } from '@/modules/DaliProgrammingStudio/Dialogs/LoadDesignDialog';
import type { VerificationReport } from '@/modules/DaliProgrammingStudio/Verification/VerificationReport';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  report: VerificationReport | null;
}

export const VerificationReportDialog: React.FC<Props> = ({ isOpen, onClose, report }) => {
  if (!isOpen || !report) return null;

  const { summary } = report;

  return (
    <Modal onClose={onClose} title="Verification Report">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        <Stat label="Passed" value={summary.passed} color="#4ADE80" />
        <Stat label="Failed" value={summary.failed} color="#F87171" />
        {/* Note: The backend currently only returns Passed/Failed. These two are placeholders until we add them. */}
        <Stat label="Unsupported" value={(summary as any).notSupported ?? 0} color="#FBBF24" />
        <Stat label="Not Tested" value={(summary as any).notTested ?? 0} color="#94A3B8" />
      </div>

      <div style={{ 
        padding: 10, 
        background: report.isFullyVerified ? '#143021' : '#3F1D1D', 
        border: `1px solid ${report.isFullyVerified ? '#4ADE80' : '#F87171'}`,
        borderRadius: 4, marginBottom: 12, textAlign: 'center',
      }}>
        <div style={{ color: report.isFullyVerified ? '#4ADE80' : '#F87171', fontWeight: 'bold', fontSize: 12 }}>
          {report.isFullyVerified ? '✓ Fully Verified' : '✗ Issues Detected'}
        </div>
      </div>

      <div style={{ maxHeight: 250, overflow: 'auto' }}>
        {report.results.map((r: any, index: number) => (
          // FIX: Using deviceId as the key, with a fallback to index to prevent duplicate key warnings
          <div key={r.deviceId || index} style={{ padding: 6, borderBottom: '1px solid #1F2937', fontSize: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ color: '#E5E7EB' }}>
                {r.deviceId} · Address {r.expectedAddress}
              </span>
              <span style={{ 
                color: r.matchesExpected ? '#4ADE80' : '#F87171', 
                fontWeight: 'bold' 
              }}>
                {r.matchesExpected ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            <div style={{ color: '#64748B', fontFamily: 'monospace', fontSize: 9 }}>
              Expected Address: {r.expectedAddress} → Actual Address: {r.actualAddress}
              {r.errorMessage && <span style={{ color: '#F87171', display: 'block' }}>{r.errorMessage}</span>}
            </div>
          </div>
        ))}
      </div>

      <Footer onCancel={onClose} onConfirm={onClose} confirmLabel="Close" />
    </Modal>
  );
};

const Stat: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{ background: '#0A0F1E', border: '1px solid #1F2937', borderRadius: 4, padding: 8, textAlign: 'center' }}>
    <div style={{ color: '#64748B', fontSize: 9, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ color, fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace' }}>{value}</div>
  </div>
);