// src/modules/Commissioning/Dialogs/DiscoverySummaryDialog.tsx

import React from 'react';
import { Modal } from '@/modules/Commissioning/Dialogs/StartCommissioningDialog';

export interface DiscoverySummary {
  totalDiscovered: number;
  matched: number;
  unmatched: number;
  exceptions: number;
}

interface Props {
  summary: DiscoverySummary | null;
  onClose: () => void;
}

export const DiscoverySummaryDialog: React.FC<Props> = ({ summary, onClose }) => {
  if (!summary) return null;

  return (
    <Modal onClose={onClose} title="Discovery Summary">
      <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 16 }}>
        Scan complete — here's what was found on this line.
      </div>

      <Row label="Total Discovered" value={summary.totalDiscovered} color="#38BDF8" />
      <Row label="Matched"          value={summary.matched}         color="#4ADE80" />
      <Row label="Unmatched"        value={summary.unmatched}       color="#FBBF24" />
      <Row label="Exceptions"       value={summary.exceptions}      color="#F87171" />

      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <button
          onClick={onClose}
          style={{
            background: '#38BDF8',
            color: '#0A0F1E',
            border: 'none',
            padding: '6px 16px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 'bold',
          }}
        >
          Done
        </button>
      </div>
    </Modal>
  );
};

const Row: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 6,
      fontSize: 12,
    }}
  >
    <span style={{ color: '#94A3B8' }}>{label}</span>
    <span
      style={{
        color,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        fontSize: 14,
      }}
    >
      {value}
    </span>
  </div>
);