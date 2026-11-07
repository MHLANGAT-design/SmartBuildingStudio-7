// src/modules/GatewayManagement/Hooks/useGateways.ts

/**
 * Umbrella hook for the gateway registry.
 *
 * Exposes the gateway list, the currently selected gateway, and every
 * registry mutation (register/update/configure/fetch). Use this in the
 * GatewayRegistry/, GatewayRegistration/, and GatewayDashboard/ components
 * that need the list plus at least one mutation.
 *
 * For read-only display of a single gateway, prefer useGatewayConnection
 * (which reads status/history) or useGatewayDiagnostics.
 */

import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';

import {
  selectGateways,
  selectGatewayCount,
  selectSelectedGatewayId,
  selectSelectedGateway,
  selectGatewaysError,
  selectRegisterError,
  selectAsyncFlags,
  selectAnyLoading,
  selectConnectedGateways,
  selectErroredGateways,
  selectGatewaysByStatus,
} from '@/modules/GatewayManagement/Store/gatewayManagementSelectors';

import {
  selectGateway as selectGatewayAction,
  clearErrors,
} from '@/modules/GatewayManagement/Store/gatewayManagementSlice';

import {
  fetchGateways,
  fetchGateway,
  registerGateway,
  updateGateway,
  configureGateway,
} from '@/modules/GatewayManagement/Store/gatewayManagementThunks';

import type {
  RegisterGatewayRequest,
  UpdateGatewayRequest,
  ConfigureGatewayRequest,
} from '@/modules/GatewayManagement/Types';

export const useGateways = () => {
  const dispatch = useAppDispatch();

  const gateways = useAppSelector(selectGateways);
  const count = useAppSelector(selectGatewayCount);
  const connected = useAppSelector(selectConnectedGateways);
  const errored = useAppSelector(selectErroredGateways);
  const byStatus = useAppSelector(selectGatewaysByStatus);
  const selectedGatewayId = useAppSelector(selectSelectedGatewayId);
  const selectedGateway = useAppSelector(selectSelectedGateway);
  const error = useAppSelector(selectGatewaysError);
  const registerError = useAppSelector(selectRegisterError);
  const asyncFlags = useAppSelector(selectAsyncFlags);
  const anyLoading = useAppSelector(selectAnyLoading);

  const select = useCallback(
    (id: string | null) => dispatch(selectGatewayAction(id)),
    [dispatch]
  );

  const refresh = useCallback(
    () => dispatch(fetchGateways()).unwrap(),
    [dispatch]
  );

  const fetchOne = useCallback(
    (id: string) => dispatch(fetchGateway({ gatewayId: id })).unwrap(),
    [dispatch]
  );

  const register = useCallback(
    (req: RegisterGatewayRequest) => dispatch(registerGateway(req)).unwrap(),
    [dispatch]
  );

  const update = useCallback(
    (id: string, req: UpdateGatewayRequest) =>
      dispatch(updateGateway({ gatewayId: id, request: req })).unwrap(),
    [dispatch]
  );

  const configure = useCallback(
    (id: string, req: ConfigureGatewayRequest) =>
      dispatch(configureGateway({ gatewayId: id, request: req })).unwrap(),
    [dispatch]
  );

  const dismissErrors = useCallback(() => dispatch(clearErrors()), [dispatch]);

  return useMemo(
    () => ({
      /* state */
      gateways,
      count,
      connected,
      errored,
      byStatus,
      selectedGatewayId,
      selectedGateway,
      error,
      registerError,
      anyLoading,
      isLoading: asyncFlags.fetchGateways,
      isRegistering: asyncFlags.registerGateway,
      isUpdating: asyncFlags.updateGateway,
      isConfiguring: asyncFlags.configureGateway,
      /* actions */
      select,
      refresh,
      fetchOne,
      register,
      update,
      configure,
      dismissErrors,
    }),
    [
      gateways, count, connected, errored, byStatus,
      selectedGatewayId, selectedGateway, error, registerError,
      anyLoading, asyncFlags,
      select, refresh, fetchOne, register, update, configure, dismissErrors,
    ]
  );
};

export type UseGatewaysReturn = ReturnType<typeof useGateways>;