// src/modules/GatewayManagement/Hooks/useGatewayManagementContext.ts

/**
 * Loads and exposes the current GatewayManagement project context
 * (project / building / floor / document).
 *
 * The caller supplies the documentId (usually from useParams or the URL
 * query string). The hook only triggers a load when the id changes, and
 * debounces duplicate calls (React StrictMode double-mount, re-renders).
 *
 * This is the Gateway Management equivalent of DeviceDiscovery's
 * useDeviceDiscoveryFloorplan — same endpoint, same loader shape, just
 * fewer fields extracted.
 */

import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/Application/ConfigureStore';
import { GatewayManagementContextLoader } from '@/modules/GatewayManagement/Document/GatewayManagementContextLoader';
import {
  setContext,
  setContextLoading,
  setContextError,
} from '@/modules/GatewayManagement/Store/gatewayManagementSlice';
import {
  formatGatewayContextLabel,
} from '@/modules/GatewayManagement/Models/GatewayManagementContext';

export const useGatewayManagementContext = (documentId: string | null | undefined) => {
  const dispatch = useAppDispatch();
  const context = useAppSelector(s => s.gatewayManagement.context);
  const contextLoading = useAppSelector(s => s.gatewayManagement.contextLoading);
  const contextError = useAppSelector(s => s.gatewayManagement.contextError);

  useEffect(() => {
    if (!documentId) return;
    if (context?.documentId === documentId) return;

    let cancelled = false;
    dispatch(setContextLoading(true));

    GatewayManagementContextLoader.load(documentId).then(outcome => {
      if (cancelled) return;
      if (!outcome.ok) {
        dispatch(setContextError(outcome.error));
        return;
      }
      dispatch(setContext(outcome.context));
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, context?.documentId, dispatch]);

  const label = useMemo(() => formatGatewayContextLabel(context), [context]);

  return {
    context,
    contextLoading,
    contextError,
    label,
  };
};

export type UseGatewayManagementContextReturn = ReturnType<typeof useGatewayManagementContext>;