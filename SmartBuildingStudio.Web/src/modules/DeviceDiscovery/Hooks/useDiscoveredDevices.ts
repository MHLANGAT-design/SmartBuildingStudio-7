// src/modules/DeviceDiscovery/Hooks/useDiscoveredDevices.ts

/**
 * Focused hook for the discovered-device list.
 *
 * Provides the device list (already in store order), the selected device,
 * a select-device action, a device loader, and a small filter helper that
 * mirrors the DiscoveredDeviceFilters UI.
 *
 * The filter is *derived* state — it does not live in Redux. This hook owns
 * it with local useState so two lists on the same page can filter
 * independently.
 */

import { useCallback, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';

import {
  selectDiscoveredDevices,
  selectSelectedDevice,
  selectSelectedDeviceId,
  selectDeviceCount,
  selectDevicesError,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';

import { selectDevice } from '@/modules/DeviceDiscovery/Store/deviceDiscoverySlice';
import { fetchDiscoveredDevices } from '@/modules/DeviceDiscovery/Store/deviceDiscoveryThunks';

import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';

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

const applyFilter = (
  devices: DiscoveredDevice[],
  filters: DeviceFilterState
): DiscoveredDevice[] => {
  const term = filters.search.trim().toLowerCase();
  return devices.filter(d => {
    if (filters.status !== 'ALL' && d.status !== filters.status) return false;
    if (filters.onlineOnly && !d.isOnline) return false;
    if (!term) return true;
    return (
      d.deviceId.toLowerCase().includes(term) ||
      (d.randomAddress ?? '').toLowerCase().includes(term) ||
      (d.manufacturer ?? '').toLowerCase().includes(term) ||
      (d.shortAddress != null &&
        d.shortAddress.toString(16).toLowerCase().includes(term))
    );
  });
};

export const useDiscoveredDevices = () => {
  const dispatch = useAppDispatch();

  const devices = useAppSelector(selectDiscoveredDevices);
  const selectedDevice = useAppSelector(selectSelectedDevice);
  const selectedDeviceId = useAppSelector(selectSelectedDeviceId);
  const count = useAppSelector(selectDeviceCount);
  const error = useAppSelector(selectDevicesError);

  const [filters, setFilters] = useState<DeviceFilterState>(DEFAULT_DEVICE_FILTERS);

  const visibleDevices = useMemo(
    () => applyFilter(devices, filters),
    [devices, filters]
  );

  const select = useCallback(
    (id: string | null) => dispatch(selectDevice(id)),
    [dispatch]
  );

  const load = useCallback(
    (sessionId?: string) =>
      dispatch(fetchDiscoveredDevices({ sessionId })).unwrap(),
    [dispatch]
  );

  const resetFilters = useCallback(
    () => setFilters(DEFAULT_DEVICE_FILTERS),
    []
  );

  return {
    devices,
    visibleDevices,
    selectedDevice,
    selectedDeviceId,
    count,
    visibleCount: visibleDevices.length,
    filters,
    setFilters,
    resetFilters,
    select,
    load,
    error,
  };
};

export type UseDiscoveredDevicesReturn = ReturnType<typeof useDiscoveredDevices>;