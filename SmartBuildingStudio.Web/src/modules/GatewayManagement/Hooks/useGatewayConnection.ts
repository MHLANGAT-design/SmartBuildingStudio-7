// src/modules/GatewayManagement/Hooks/useGatewayConnection.ts

/**
 * Focused hook for a single gateway's connection lifecycle.
 *
 * Use this in GatewayConnections/ and in the header of GatewayDashboard/.
 * It reads from the status + connections slices, exposes connect/disconnect/
 * reconnect actions, and can be called without an explicit gatewayId to
 * default to the currently selected gateway.
 *
 * Note: this hook also refreshes the gateway after connect/disconnect/
 * reconnect so callers see the updated `connectionStatus` on the Gateway
 * model, not just the separate status snapshot.
 */

import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';

import {
  selectSelectedGatewayId,
  selectGatewayById,
  selectStatusForGateway,
  selectConnectionsForGateway,
  selectConnectError,
  selectDisconnectError,
  selectReconnectError,
  selectAsyncFlags,
} from '@/modules/GatewayManagement/Store/gatewayManagementSelectors';

import {
  connectGateway,
  disconnectGateway,
  reconnectGateway,
  fetchGatewayStatus,
  fetchGatewayConnections,
} from '@/modules/GatewayManagement/Store/gatewayManagementThunks';

import {
  canConnect,
  canDisconnect,
  canReconnect,
  isGatewayConnected,
  isGatewayTransitioning,
  isGatewayErrored,
} from '@/modules/GatewayManagement/Models/Gateway';

export const useGatewayConnection = (gatewayIdOverride?: string | null) => {
  const dispatch = useAppDispatch();

  const selectedId = useAppSelector(selectSelectedGatewayId);
  const targetId = gatewayIdOverride ?? selectedId;

  const gateway = useAppSelector(selectGatewayById(targetId));
  const status = useAppSelector(selectStatusForGateway(targetId));
  const connections = useAppSelector(selectConnectionsForGateway(targetId));

  const connectError = useAppSelector(selectConnectError);
  const disconnectError = useAppSelector(selectDisconnectError);
  const reconnectError = useAppSelector(selectReconnectError);
  const asyncFlags = useAppSelector(selectAsyncFlags);

  const canStartConnect = gateway ? canConnect(gateway) : false;
  const canStartDisconnect = gateway ? canDisconnect(gateway) : false;
  const canStartReconnect = gateway ? canReconnect(gateway) : false;
  const connected = gateway ? isGatewayConnected(gateway) : false;
  const transitioning = gateway ? isGatewayTransitioning(gateway) : false;
  const errored = gateway ? isGatewayErrored(gateway) : false;

  const connect = useCallback(async () => {
    if (!targetId) throw new Error('No gateway selected.');
    return dispatch(connectGateway({ gatewayId: targetId })).unwrap();
  }, [dispatch, targetId]);

  const disconnect = useCallback(async (reason?: string | null) => {
    if (!targetId) throw new Error('No gateway selected.');
    return dispatch(disconnectGateway({ gatewayId: targetId, reason })).unwrap();
  }, [dispatch, targetId]);

  const reconnect = useCallback(async () => {
    if (!targetId) throw new Error('No gateway selected.');
    return dispatch(reconnectGateway({ gatewayId: targetId })).unwrap();
  }, [dispatch, targetId]);

  const refreshStatus = useCallback(async () => {
    if (!targetId) throw new Error('No gateway selected.');
    return dispatch(fetchGatewayStatus({ gatewayId: targetId })).unwrap();
  }, [dispatch, targetId]);

  const loadConnections = useCallback(async () => {
    if (!targetId) throw new Error('No gateway selected.');
    return dispatch(fetchGatewayConnections({ gatewayId: targetId })).unwrap();
  }, [dispatch, targetId]);

  return useMemo(
    () => ({
      /* state */
      gatewayId: targetId,
      gateway,
      status,
      connections,
      connected,
      transitioning,
      errored,
      /* capability flags for enabling/disabling buttons */
      canConnect: canStartConnect,
      canDisconnect: canStartDisconnect,
      canReconnect: canStartReconnect,
      /* loading */
      isConnecting: asyncFlags.connectGateway,
      isDisconnecting: asyncFlags.disconnectGateway,
      isReconnecting: asyncFlags.reconnectGateway,
      isRefreshingStatus: asyncFlags.fetchStatus,
      isLoadingConnections: asyncFlags.fetchConnections,
      /* errors */
      connectError,
      disconnectError,
      reconnectError,
      /* actions */
      connect,
      disconnect,
      reconnect,
      refreshStatus,
      loadConnections,
    }),
    [
      targetId, gateway, status, connections,
      connected, transitioning, errored,
      canStartConnect, canStartDisconnect, canStartReconnect,
      asyncFlags, connectError, disconnectError, reconnectError,
      connect, disconnect, reconnect, refreshStatus, loadConnections,
    ]
  );
};

export type UseGatewayConnectionReturn = ReturnType<typeof useGatewayConnection>;