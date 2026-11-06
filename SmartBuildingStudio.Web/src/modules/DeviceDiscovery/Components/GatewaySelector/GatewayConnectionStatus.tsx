// src/modules/DeviceDiscovery/Components/GatewaySelector/GatewayConnectionStatus.tsx

import React from 'react';

export type GatewayConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'ERROR';

interface Props {
  state: GatewayConnectionState;
  /** Optional detail — e.g. last error message or reconnect attempt count. */
  detail?: string | null;
  /** Compact one-line variant (default) vs. stacked variant with detail. */
  variant?: 'inline' | 'stacked';
}

const STATE_CONFIG: Record<
  GatewayConnectionState,
  { color: string; label: string; pulse: boolean }
> = {
  DISCONNECTED: { color: '#64748B', label: 'Disconnected', pulse: false },
  CONNECTING:   { color: '#FBBF24', label: 'Connecting…',  pulse: true  },
  CONNECTED:    { color: '#4ADE80', label: 'Connected',    pulse: false },
  RECONNECTING: { color: '#FBBF24', label: 'Reconnecting…',pulse: true  },
  ERROR:        { color: '#F87171', label: 'Connection error', pulse: false },
};

export const GatewayConnectionStatus: React.FC<Props> = ({
  state,
  detail,
  variant = 'inline',
}) => {
  const cfg = STATE_CONFIG[state];

  const dot = (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: cfg.color,
        boxShadow: cfg.pulse ? `0 0 0 2px ${cfg.color}33` : undefined,
        animation: cfg.pulse ? 'dd-gw-pulse 1.4s ease-in-out infinite' : undefined,
        flexShrink: 0,
      }}
    />
  );

  const label = (
    <span style={{ color: cfg.color, fontWeight: 'bold', fontSize: 11 }}>
      {cfg.label}
    </span>
  );

  if (variant === 'inline') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <style>{`@keyframes dd-gw-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        {dot}
        {label}
        {detail && <span style={{ fontSize: 10, color: '#64748B' }}>· {detail}</span>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <style>{`@keyframes dd-gw-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {dot}
        {label}
      </div>
      {detail && (
        <div style={{ fontSize: 10, color: '#64748B', paddingLeft: 14 }}>
          {detail}
        </div>
      )}
    </div>
  );
};