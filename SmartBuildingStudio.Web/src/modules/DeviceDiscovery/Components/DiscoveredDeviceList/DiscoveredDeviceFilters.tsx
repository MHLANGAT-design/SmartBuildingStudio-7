// src/modules/DeviceDiscovery/Components/DiscoveredDeviceList/DiscoveredDeviceFilters.tsx

import React from 'react';
import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Types/DeviceDiscovery.types';

export interface DeviceFilterState {
  search: string;
  status: DiscoveredDevice['status'] | 'ALL';
  onlineOnly: boolean;
}

export const DEFAULT_DEVICE_FILTERS: DeviceFilterState = {
  search: '',
  status: 'ALL',
  onlineOnly: false,
};

interface Props {
  filters: DeviceFilterState;
  onChange: (filters: DeviceFilterState) => void;
  totalCount: number;
  visibleCount: number;
}

const STATUS_OPTIONS: Array<DeviceFilterState['status']> = [
  'ALL', 'UNKNOWN', 'IDENTIFIED', 'MATCHED', 'EXCEPTION',
];

export const DiscoveredDeviceFilters: React.FC<Props> = ({
  filters,
  onChange,
  totalCount,
  visibleCount,
}) => {
  const update = (patch: Partial<DeviceFilterState>) => onChange({ ...filters, ...patch });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      padding: '8px 12px',
      borderBottom: '1px solid #1F2937',
    }}>
      <input
        type="text"
        value={filters.search}
        onChange={e => update({ search: e.target.value })}
        placeholder="Search by address, manufacturer…"
        style={{
          padding: '5px 8px',
          background: '#1E293B',
          color: '#E5E7EB',
          border: '1px solid #1F2937',
          borderRadius: 4,
          fontSize: 11,
          outline: 'none',
        }}
      />
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {STATUS_OPTIONS.map(option => (
          <button
            key={option}
            onClick={() => update({ status: option })}
            style={{
              padding: '2px 8px',
              borderRadius: 10,
              fontSize: 10,
              border: '1px solid',
              borderColor: filters.status === option ? '#38BDF8' : '#1F2937',
              background: filters.status === option ? '#0EA5E922' : 'transparent',
              color: filters.status === option ? '#38BDF8' : '#94A3B8',
              cursor: 'pointer',
            }}
          >
            {option}
          </button>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#94A3B8', marginLeft: 'auto' }}>
          <input
            type="checkbox"
            checked={filters.onlineOnly}
            onChange={e => update({ onlineOnly: e.target.checked })}
          />
          Online only
        </label>
      </div>
      <div style={{ fontSize: 10, color: '#64748B' }}>
        {visibleCount} of {totalCount} device{totalCount === 1 ? '' : 's'}
      </div>
    </div>
  );
};