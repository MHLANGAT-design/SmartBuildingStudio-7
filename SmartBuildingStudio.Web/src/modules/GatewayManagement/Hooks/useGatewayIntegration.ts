// src/modules/GatewayManagement/Hooks/useGatewayIntegration.ts

/**
 * Focused hook for the GatewayIntegration subsystem state.
 *
 * Reads the current `GatewayIntegration/state` (UseMock, health check
 * interval, reconnect attempts) and exposes a ping action per gateway.
 * Used in GatewayIntegration/ and in GatewayDashboard/ for a
 * "mock mode is on / off" badge.
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';

import {
  selectIntegrationState,
  selectSelectedGatewayId,
  selectErrors,
} from '@/modules/GatewayManagement/Store/gatewayManagementSelectors';

import {
  fetchIntegrationState,
  pingGateway,
} from '@/modules/GatewayManagement/Store/gatewayManagementThunks';

export const useGatewayIntegration = (options: { loadOnMount?: boolean } = {}) => {
  const { loadOnMount = true } = options;
  const dispatch = useAppDispatch();

  const state = useAppSelector(selectIntegrationState);
  const selectedGatewayId = useAppSelector(selectSelectedGatewayId);
  const errors = useAppSelector(selectErrors);

  // Load integration state once on mount (unless disabled).
  useEffect(() => {
    if (!loadOnMount) return;
    void dispatch(fetchIntegrationState());
  }, [dispatch, loadOnMount]);

  const refresh = useCallback(
    () => dispatch(fetchIntegrationState()).unwrap(),
    [dispatch]
  );

  const ping = useCallback(
    async (gatewayId?: string | null) => {
      const id = gatewayId ?? selectedGatewayId;
      if (!id) throw new Error('No gateway selected.');
      return dispatch(pingGateway({ gatewayId: id })).unwrap();
    },
    [dispatch, selectedGatewayId]
  );

  const isMockMode = state?.useMock ?? false;

  return useMemo(
    () => ({
      state,
      isMockMode,
      healthCheckIntervalSeconds: state?.healthCheckIntervalSeconds ?? 0,
      maxReconnectAttempts: state?.maxReconnectAttempts ?? 0,
      isLoading: false, // not tracked in slice; would need a dedicated flag if needed
      error: errors.integration,
      refresh,
      ping,
    }),
    [state, isMockMode, errors.integration, refresh, ping]
  );
};

export type UseGatewayIntegrationReturn = ReturnType<typeof useGatewayIntegration>;