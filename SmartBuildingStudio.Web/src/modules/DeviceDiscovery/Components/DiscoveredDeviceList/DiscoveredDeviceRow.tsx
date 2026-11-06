// src/modules/DeviceDiscovery/Components/DiscoveredDeviceList/DiscoveredDeviceRow.tsx

import React from 'react';
import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Types/DeviceDiscovery.types';

interface Props {
  device: DiscoveredDevice;
  selected: boolean;
  onSelect: (deviceId: string) => void;
}

const statusColor = (status: DiscoveredDevice['status']): string =>
  status === 'MATCHED' ? '#4ADE80'
  : status === 'EXCEPTION' ? '#F87171'
  : status === 'IDENTIFIED' ? '#FBBF24'
  : '#64748B';

export const DiscoveredDeviceRow: React.FC<Props> = ({ device, selected, onSelect }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={() => onSelect(device.deviceId)}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(device.deviceId);
      }
    }}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      background: selected ? '#1E293B' : 'transparent',
      borderLeft: selected ? '2px solid #38BDF8' : '2px solid transparent',
      borderBottom: '1px solid #1F2937',
      cursor: 'pointer',
      outline: 'none',
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <div style={{
        fontSize: 12,
        color: '#E5E7EB',
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {device.shortAddress != null
          ? `0x${device.shortAddress.toString(16).padStart(4, '0')}`
          : device.randomAddress ?? device.deviceId}
      </div>
      <div style={{ fontSize: 10, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {device.manufacturer ?? 'Unknown'} · {device.firmwareVersion ?? 'N/A'}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: device.isOnline ? '#4ADE80' : '#64748B',
      }} />
      <span style={{ fontSize: 10, color: statusColor(device.status), fontWeight: 'bold' }}>
        {device.status}
      </span>
    </div>
  </div>
);