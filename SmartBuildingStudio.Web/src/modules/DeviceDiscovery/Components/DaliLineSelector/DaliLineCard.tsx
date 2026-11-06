// src/modules/DeviceDiscovery/Components/DaliLineSelector/DaliLineCard.tsx

import React from 'react';

export interface DaliLineSummary {
  /** Stable identifier from ProjectExplorer's DALI design. */
  lineId: string;
  /** Human-readable line name, e.g. "Line A — Floor 1 East". */
  name: string;
  /** Gateway-side short address of the line controller, if known. */
  controllerAddress?: number | null;
  /** Number of fixtures the design places on this line. */
  designedFixtureCount?: number | null;
  /** Number of devices already discovered on this line (if a session is running). */
  discoveredDeviceCount?: number | null;
  /** Whether the line is currently reachable via the selected gateway. */
  isReachable?: boolean;
}

interface Props {
  line: DaliLineSummary;
  selected: boolean;
  disabled?: boolean;
  onSelect: (lineId: string) => void;
}

const formatAddress = (addr: number | null | undefined): string =>
  addr == null ? '—' : `0x${addr.toString(16).toUpperCase().padStart(2, '0')}`;

export const DaliLineCard: React.FC<Props> = ({
  line,
  selected,
  disabled,
  onSelect,
}) => {
  const reachable = line.isReachable !== false;

  const discovered = line.discoveredDeviceCount ?? null;
  const designed = line.designedFixtureCount ?? null;
  const countLabel =
    designed == null && discovered == null
      ? '—'
      : `${discovered ?? 0} / ${designed ?? '—'} fixtures`;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={() => !disabled && onSelect(line.lineId)}
      onKeyDown={e => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(line.lineId);
        }
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '8px 10px',
        borderRadius: 4,
        border: '1px solid',
        borderColor: selected ? '#38BDF8' : '#1F2937',
        background: selected ? '#0EA5E915' : '#0F1424',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        outline: 'none',
        transition: 'border-color 120ms ease, background 120ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{
          fontSize: 12,
          fontWeight: 'bold',
          color: selected ? '#38BDF8' : '#E5E7EB',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {line.name}
        </div>
        <span style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: reachable ? '#4ADE80' : '#F87171',
          flexShrink: 0,
        }} title={reachable ? 'Reachable' : 'Unreachable'} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B' }}>
        <span>Controller</span>
        <span style={{ fontFamily: 'monospace', color: '#94A3B8' }}>
          {formatAddress(line.controllerAddress)}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B' }}>
        <span>Discovered</span>
        <span style={{ color: '#94A3B8' }}>{countLabel}</span>
      </div>
    </div>
  );
};