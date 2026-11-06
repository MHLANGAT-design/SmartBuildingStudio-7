// src/modules/DeviceDiscovery/Components/DiscoveredDeviceList/DiscoveredDeviceList.tsx

import React, { useMemo, useState } from 'react';
import { useAppSelector } from '@/Application/ConfigureStore';
import {
  selectDiscoveredDevices,
  selectSelectedDeviceId,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';
import { useDeviceDiscovery } from '@/modules/DeviceDiscovery/Hooks/useDeviceDiscovery';
import { DiscoveredDeviceRow } from '@/modules/DeviceDiscovery/Components/DiscoveredDeviceList/DiscoveredDeviceRow';
import {
  DiscoveredDeviceFilters,
  DEFAULT_DEVICE_FILTERS,
  type DeviceFilterState,
} from '@/modules/DeviceDiscovery/Components/DiscoveredDeviceList/DiscoveredDeviceFilters';

export const DiscoveredDeviceList: React.FC = () => {
  const devices = useAppSelector(selectDiscoveredDevices);
  const selectedId = useAppSelector(selectSelectedDeviceId);
  const { selectDevice } = useDeviceDiscovery();
  const [filters, setFilters] = useState<DeviceFilterState>(DEFAULT_DEVICE_FILTERS);

  const visible = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return devices.filter(d => {
      if (filters.status !== 'ALL' && d.status !== filters.status) return false;
      if (filters.onlineOnly && !d.isOnline) return false;
      if (!term) return true;
      return (
        d.deviceId.toLowerCase().includes(term) ||
        (d.randomAddress ?? '').toLowerCase().includes(term) ||
        (d.manufacturer ?? '').toLowerCase().includes(term) ||
        (d.shortAddress != null && d.shortAddress.toString(16).toLowerCase().includes(term))
      );
    });
  }, [devices, filters]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <DiscoveredDeviceFilters
        filters={filters}
        onChange={setFilters}
        totalCount={devices.length}
        visibleCount={visible.length}
      />
      {/* 
        This is the actual scroll container. The paddingBottom goes HERE,
        not on a wrapper above — because this div owns the scrollbar.
        The bottom padding gives the last row clearance above the toolbar.
      */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 60 }}>
        {visible.length === 0 ? (
          <div style={{ padding: 16, fontSize: 11, color: '#64748B', textAlign: 'center' }}>
            {devices.length === 0
              ? 'No devices discovered yet for this line.'
              : 'No devices match the current filters.'}
          </div>
        ) : (
          visible.map(device => (
            <DiscoveredDeviceRow
              key={device.deviceId}
              device={device}
              selected={device.deviceId === selectedId}
              onSelect={selectDevice}
            />
          ))
        )}
      </div>
    </div>
  );
};