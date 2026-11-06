// src/modules/DeviceDiscovery/Hooks/useDiscoverySession.ts

/**
 * Focused hook for discovery session lifecycle.
 *
 * Use this in the toolbar / workspace header / any place that only needs
 * session state and start/stop/create. For anything broader, use
 * useDeviceDiscovery instead.
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';

import {
  selectSession,
  selectSessionId,
  selectSessionPhase,
  selectSessionProgress,
  selectIsDiscovering,
  selectIsSessionLoading,
  selectSessionError,
  selectSelectedGatewayId,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySelectors';

import {
  createSession,
  startDiscovery,
  stopDiscovery,
  cancelDiscovery,
  refreshSession,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoveryThunks';
import type { CreateSessionArgs } from '@/modules/DeviceDiscovery/Store/deviceDiscoveryThunks';

import { isSessionStartable, isSessionStoppable } from '@/modules/DeviceDiscovery/Models/DiscoverySession';
import type { DiscoverySessionScope } from '@/modules/DeviceDiscovery/Models/DiscoverySession';

export const useDiscoverySession = () => {
  const dispatch = useAppDispatch();

  const session = useAppSelector(selectSession);
  const sessionId = useAppSelector(selectSessionId);
  const phase = useAppSelector(selectSessionPhase);
  const progress = useAppSelector(selectSessionProgress);
  const isDiscovering = useAppSelector(selectIsDiscovering);
  const isLoading = useAppSelector(selectIsSessionLoading);
  const error = useAppSelector(selectSessionError);
  const selectedGatewayId = useAppSelector(selectSelectedGatewayId);

  const canStart = isSessionStartable(session);
  const canStop = isSessionStoppable(session);

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

  return {
    session,
    sessionId,
    phase,
    progress,
    isDiscovering,
    isLoading,
    error,
    canStart,
    canStop,
    selectedGatewayId,
    create,
    start,
    stop,
    cancel,
    refresh,
  };
};

export type UseDiscoverySessionReturn = ReturnType<typeof useDiscoverySession>;