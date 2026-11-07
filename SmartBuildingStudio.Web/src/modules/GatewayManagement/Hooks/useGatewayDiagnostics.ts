// src/modules/GatewayManagement/Hooks/useGatewayDiagnostics.ts

/**
 * Focused hook for gateway diagnostics.
 *
 * Reads the latest diagnostics snapshot for a gateway and exposes two
 * actions: get (uses the last stored result) and run (triggers a fresh
 * ping). The `run` action is what the Diagnostics panel's "Run" button
 * calls; `get` is for refresh-on-mount.
 */

import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';

import {
  selectSelectedGatewayId,
  selectDiagnosticsForGateway,
  selectDiagnosticsError,
  selectAsyncFlags,
} from '@/modules/GatewayManagement/Store/gatewayManagementSelectors';

import {
  fetchGatewayDiagnostics,
  runGatewayDiagnostics,
} from '@/modules/GatewayManagement/Store/gatewayManagementThunks';

export const useGatewayDiagnostics = (gatewayIdOverride?: string | null) => {
  const dispatch = useAppDispatch();

  const selectedId = useAppSelector(selectSelectedGatewayId);
  const targetId = gatewayIdOverride ?? selectedId;

  const diagnostics = useAppSelector(selectDiagnosticsForGateway(targetId));
  const error = useAppSelector(selectDiagnosticsError);
  const asyncFlags = useAppSelector(selectAsyncFlags);

  const get = useCallback(async () => {
    if (!targetId) throw new Error('No gateway selected.');
    return dispatch(fetchGatewayDiagnostics({ gatewayId: targetId })).unwrap();
  }, [dispatch, targetId]);

  const run = useCallback(async () => {
    if (!targetId) throw new Error('No gateway selected.');
    return dispatch(runGatewayDiagnostics({ gatewayId: targetId })).unwrap();
  }, [dispatch, targetId]);

  return useMemo(
    () => ({
      gatewayId: targetId,
      diagnostics,
      isHealthy: diagnostics?.isHealthy ?? false,
      latencyMs: diagnostics?.latencyMs ?? 0,
      checks: diagnostics?.checks ?? [],
      isLoading: asyncFlags.fetchDiagnostics,
      isRunning: asyncFlags.runDiagnostics,
      error,
      get,
      run,
    }),
    [targetId, diagnostics, asyncFlags, error, get, run]
  );
};

export type UseGatewayDiagnosticsReturn = ReturnType<typeof useGatewayDiagnostics>;