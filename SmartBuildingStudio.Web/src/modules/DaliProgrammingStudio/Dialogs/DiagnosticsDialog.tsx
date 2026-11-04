// src/modules/DaliProgrammingStudio/Dialogs/DiagnosticsDialog.tsx

import React from 'react';
import { Modal, Footer } from '@/modules/DaliProgrammingStudio/Dialogs/LoadDesignDialog';
import type { DiagnosticsReport } from '@/modules/DaliProgrammingStudio/Diagnostics/DiagnosticsReport';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  report: DiagnosticsReport | null;
}

export const DiagnosticsDialog: React.FC<Props> = ({ isOpen, onClose, report }) => {
  if (!isOpen || !report) return null;

  // FIX: Fall back to empty arrays in case the backend mock doesn't include these fields
  const deviceStatuses = (report as any).deviceStatuses ?? [];
  const globalIssues = (report as any).globalIssues ?? [];

  return (
    <Modal onClose={onClose} title="Diagnostics Report">
      
      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        <Stat label="Successful" value={(report as any).busStats?.successful ?? 0} color="#4ADE80" />
        <Stat label="Failed" value={(report as any).busStats?.failed ?? 0} color="#F87171" />
        <Stat label="Timeouts" value={(report as any).busStats?.timeouts ?? 0} color="#FBBF24" />
      </div>

      <div style={{ 
        padding: 10, 
        background: (report as any).isHealthy ? '#143021' : '#3F1D1D', 
        border: `1px solid ${(report as any).isHealthy ? '#4ADE80' : '#F87171'}`,
        borderRadius: 4, marginBottom: 12, textAlign: 'center',
      }}>
        <div style={{ color: (report as any).isHealthy ? '#4ADE80' : '#F87171', fontWeight: 'bold', fontSize: 12 }}>
          {(report as any).isHealthy ? '✓ Bus is Healthy' : '✗ Issues Detected'}
        </div>
      </div>

      {/* Global Issues */}
      {globalIssues.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: '#38BDF8', fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>GLOBAL ISSUES</div>
          {globalIssues.map((issue: string, index: number) => (
            <div key={index} style={{ color: '#F87171', fontSize: 10, padding: '2px 0' }}>• {issue}</div>
          ))}
        </div>
      )}

      {/* Device Statuses */}
      <div style={{ maxHeight: 250, overflow: 'auto' }}>
        <div style={{ color: '#38BDF8', fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>DEVICE STATUS</div>
        {deviceStatuses.length === 0 && (
          <div style={{ color: '#64748B', fontSize: 10 }}>No device issues reported.</div>
        )}
        {deviceStatuses.map((device: any, index: number) => (
          <div key={device.deviceId || index} style={{ padding: 6, borderBottom: '1px solid #1F2937', fontSize: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ color: '#E5E7EB' }}>{device.deviceId}</span>
              <span style={{ 
                color: device.status === 'OK' ? '#4ADE80' : device.status === 'WARNING' ? '#FBBF24' : '#F87171', 
                fontWeight: 'bold' 
              }}>
                {device.status}
              </span>
            </div>
            <div style={{ color: '#64748B', fontFamily: 'monospace', fontSize: 9 }}>
              Address: {device.shortAddress ?? '—'} · Errors: {device.errorCode ?? 0}
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