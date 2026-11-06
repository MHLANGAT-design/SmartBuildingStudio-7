// src/modules/DeviceDiscovery/Components/GatewaySelector/GatewayStatusCard.tsx

import React from 'react';
import {
  GatewayConnectionStatus,
  type GatewayConnectionState,
} from '@/modules/DeviceDiscovery/Components/GatewaySelector/GatewayConnectionStatus';

export interface GatewayStatusSummary {
  gatewayId: string;
  name: string;
  /** e.g. "DALI-2", "HTTP", "TCP" — from GatewayManagement registry. */
  protocol?: string | null;
  /** Serial / model / endpoint descriptor. */
  identifier?: string | null;
  connectionState: GatewayConnectionState;
  /** Optional detail surfaced under the connection state (last error, etc.). */
  connectionDetail?: string | null;
  /** Number of DALI lines this gateway exposes, if known. */
  lineCount?: number | null;
}

interface Props {
  gateway: GatewayStatusSummary;
  selected: boolean;
  disabled?: boolean;
  onSelect: (gatewayId: string) => void;
  /** Optional refresh callback — renders a small action if provided. */
  onRefresh?: (gatewayId: string) => void;
}

export const GatewayStatusCard: React.FC<Props> = ({
  gateway,
  selected,
  disabled,
  onSelect,
  onRefresh,
}) => {
  const interactive = !disabled;

  return (
    <div
      role="button"
      tabIndex={interactive ? 0 : -1}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={() => interactive && onSelect(gateway.gatewayId)}
      onKeyDown={e => {
        if (!interactive) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(gateway.gatewayId);
        }
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '10px 12px',
        borderRadius: 4,
        border: '1px solid',
        borderColor: selected ? '#38BDF8' : '#1F2937',
        background: selected ? '#0EA5E915' : '#0F1424',
        cursor: interactive ? 'pointer' : 'not-allowed',
        opacity: interactive ? 1 : 0.5,
        outline: 'none',
        transition: 'border-color 120ms ease, background 120ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 'bold',
            color: selected ? '#38BDF8' : '#E5E7EB',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {gateway.name}
          </div>
          <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {gateway.identifier ?? gateway.gatewayId}
          </div>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onRefresh(gateway.gatewayId);
            }}
            disabled={!interactive}
            title="Refresh gateway status"
            style={{
              padding: '2px 6px',
              background: 'transparent',
              border: '1px solid #1F2937',
              borderRadius: 3,
              color: '#94A3B8',
              fontSize: 10,
              cursor: interactive ? 'pointer' : 'not-allowed',
              flexShrink: 0,
            }}
          >
            Refresh
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <GatewayConnectionStatus
          state={gateway.connectionState}
          detail={gateway.connectionDetail ?? undefined}
        />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 10, color: '#64748B' }}>
          {gateway.protocol && (
            <span style={{
              padding: '1px 6px',
              borderRadius: 8,
              background: '#1E293B',
              color: '#38BDF8',
            }}>
              {gateway.protocol}
            </span>
          )}
          {gateway.lineCount != null && (
            <span>{gateway.lineCount} line{gateway.lineCount === 1 ? '' : 's'}</span>
          )}
        </div>
      </div>
    </div>
  );
};