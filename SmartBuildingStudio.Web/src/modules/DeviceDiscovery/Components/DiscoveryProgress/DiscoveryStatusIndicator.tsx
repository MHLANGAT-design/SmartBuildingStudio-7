// src/modules/DeviceDiscovery/Components/DiscoveryProgress/DiscoveryStatusIndicator.tsx

import React from 'react';

export type DiscoveryPhase =
  | 'IDLE'
  | 'STARTING'
  | 'DISCOVERING'
  | 'IDENTIFYING'
  | 'MATCHING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

interface Props {
  phase: DiscoveryPhase;
  message?: string;
}

const PHASE_CONFIG: Record<DiscoveryPhase, { color: string; label: string; pulse: boolean }> = {
  IDLE:       { color: '#64748B', label: 'Idle',          pulse: false },
  STARTING:   { color: '#FBBF24', label: 'Starting',      pulse: true  },
  DISCOVERING:{ color: '#38BDF8', label: 'Discovering',   pulse: true  },
  IDENTIFYING:{ color: '#38BDF8', label: 'Identifying',   pulse: true  },
  MATCHING:   { color: '#38BDF8', label: 'Matching',      pulse: true  },
  COMPLETED:  { color: '#4ADE80', label: 'Completed',     pulse: false },
  FAILED:     { color: '#F87171', label: 'Failed',        pulse: false },
  CANCELLED:  { color: '#94A3B8', label: 'Cancelled',     pulse: false },
};

export const DiscoveryStatusIndicator: React.FC<Props> = ({ phase, message }) => {
  const cfg = PHASE_CONFIG[phase];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: cfg.color,
        boxShadow: cfg.pulse ? `0 0 0 2px ${cfg.color}33` : undefined,
        animation: cfg.pulse ? 'dd-pulse 1.4s ease-in-out infinite' : undefined,
      }} />
      <style>{`@keyframes dd-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      <span style={{ color: cfg.color, fontWeight: 'bold' }}>{cfg.label}</span>
      {message && <span style={{ color: '#64748B' }}>— {message}</span>}
    </div>
  );
};