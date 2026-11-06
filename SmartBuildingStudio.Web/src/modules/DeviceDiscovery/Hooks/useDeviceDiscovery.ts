// src/modules/DeviceDiscovery/Hooks/useDeviceDiscovery.ts

/**
 * Umbrella hook for DeviceDiscovery.
 *
 * Exposes the current session, device counts, selection, session actions,
 * and errors. Use this when a component needs more than one concern; use the
 * focused hooks (useDiscoverySession, useDiscoveredDevices, etc.) otherwise.
 *
 * All returned callbacks are stable (useCallback with no changing deps) so
 * passing them to child components does not cause re-renders.
 */

import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';

import {
  selectSession,
  selectSessionId,
  selectIsDiscovering,
  selectIsSessionLoading,
  selectSessionPhase,
  selectSessionProgress,
  selectDiscoveredDevices,
  selectDeviceCount,
  selectSelectedDevice,
  selectSelectedDeviceId,
  selectSelectedGatewayId,
  selectSelectedDaliLineId,
  selectFirstError,
  selectAnyLoading,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';

import {
  selectDevice,
  selectGateway,
  selectDaliLine,
  clearSession,
  clearErrors,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySlice';

import {
  createSession,
  startDiscovery,
  stopDiscovery,
  cancelDiscovery,
  refreshSession,
  fetchDiscoveredDevices,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoveryThunks';

import type { CreateSessionArgs } from '@/modules/DeviceDiscovery/Store/deviceDiscoveryThunks';
import { isSessionStartable, isSessionStoppable } from '@/modules/DeviceDiscovery/Models/DiscoverySession';
import type { DiscoverySessionScope } from '@/modules/DeviceDiscovery/Models/DiscoverySession';

export const useDeviceDiscovery = () => {
  const dispatch = useAppDispatch();

  const session = useAppSelector(selectSession);
  const sessionId = useAppSelector(selectSessionId);
  const isDiscovering = useAppSelector(selectIsDiscovering);
  const isSessionLoading = useAppSelector(selectIsSessionLoading);
  const phase = useAppSelector(selectSessionPhase);
  const progress = useAppSelector(selectSessionProgress);

  const devices = useAppSelector(selectDiscoveredDevices);
  const deviceCount = useAppSelector(selectDeviceCount);
  const selectedDevice = useAppSelector(selectSelectedDevice);
  const selectedDeviceId = useAppSelector(selectSelectedDeviceId);
  const selectedGatewayId = useAppSelector(selectSelectedGatewayId);
  const selectedDaliLineId = useAppSelector(selectSelectedDaliLineId);

  const anyLoading = useAppSelector(selectAnyLoading);
  const error = useAppSelector(selectFirstError);

  const canStart = isSessionStartable(session);
  const canStop = isSessionStoppable(session);

  /* ---- Selection ---- */
  const selectDeviceById = useCallback(
    (id: string | null) => dispatch(selectDevice(id)),
    [dispatch]
  );
  const selectGatewayById = useCallback(
    (id: string | null) => dispatch(selectGateway(id)),
    [dispatch]
  );
  const selectDaliLineById = useCallback(
    (id: string | null) => dispatch(selectDaliLine(id)),
    [dispatch]
  );

  /* ---- Lifecycle ---- */
  const create = useCallback(
    (gatewayId: string, scope: DiscoverySessionScope, initiatedBy?: string | null) => {
      const args: CreateSessionArgs = { gatewayId, scope, initiatedBy };
      return dispatch(createSession(args)).unwrap();
    },
    [dispatch]
  );
  const start = useCallback(
    (id?: string) => dispatch(startDiscovery({ sessionId: id })).unwrap(),
    [dispatch]
  );
  const stop = useCallback(
    (id?: string) => dispatch(stopDiscovery({ sessionId: id })).unwrap(),
    [dispatch]
  );
  const cancel = useCallback(
    (id?: string) => dispatch(cancelDiscovery({ sessionId: id })).unwrap(),
    [dispatch]
  );
  const refresh = useCallback(
    (id?: string) => dispatch(refreshSession({ sessionId: id })).unwrap(),
    [dispatch]
  );
  const loadDevices = useCallback(
    (id?: string) => dispatch(fetchDiscoveredDevices({ sessionId: id })).unwrap(),
    [dispatch]
  );
  const reset = useCallback(() => dispatch(clearSession()), [dispatch]);
  const dismissError = useCallback(() => dispatch(clearErrors()), [dispatch]);

  return useMemo(
    () => ({
      /* state */
      session,
      sessionId,
      phase,
      progress,
      isDiscovering,
      isSessionLoading,
      devices,
      deviceCount,
      selectedDevice,
      selectedDeviceId,
      selectedGatewayId,
      selectedDaliLineId,
      anyLoading,
      error,
      canStart,
      canStop,
      /* selection */
      selectDevice: selectDeviceById,
      selectGateway: selectGatewayById,
      selectDaliLine: selectDaliLineById,
      /* lifecycle */
      create,
      start,
      stop,
      cancel,
      refresh,
      loadDevices,
      reset,
      dismissError,
    }),
    [
      session, sessionId, phase, progress, isDiscovering, isSessionLoading,
      devices, deviceCount, selectedDevice, selectedDeviceId,
      selectedGatewayId, selectedDaliLineId, anyLoading, error,
      canStart, canStop,
      selectDeviceById, selectGatewayById, selectDaliLineById,
      create, start, stop, cancel, refresh, loadDevices, reset, dismissError,
    ]
  );
};

export type UseDeviceDiscoveryReturn = ReturnType<typeof useDeviceDiscovery>;