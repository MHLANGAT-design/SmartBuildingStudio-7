// src/modules/GatewayManagement/Store/gatewayManagementSelectors.ts

/**
 * Memoized selectors for GatewayManagement. All list-returning selectors
 * use createSelector so their reference is stable across renders.
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/Application/ConfigureStore';

import type { Gateway } from '@/modules/GatewayManagement/Models/Gateway';
import type {
  GatewayConnection,
  GatewayStatus,
} from '@/modules/GatewayManagement/Models/GatewayConnection';
import type {
  GatewayOperation,
  GatewayDiagnostics,
} from '@/modules/GatewayManagement/Models/GatewayOperation';
import type { GatewayAssignmentDto } from '@/modules/GatewayManagement/Types';

/* ------------------------------------------------------------------ */
/* Slice root                                                          */
/* ------------------------------------------------------------------ */

export const selectGatewayManagement = (s: RootState) => s.gatewayManagement;

/* ------------------------------------------------------------------ */
/* Gateways                                                            */
/* ------------------------------------------------------------------ */

export const selectGateways = createSelector(
  [
    (s: RootState) => s.gatewayManagement.gatewaysById,
    (s: RootState) => s.gatewayManagement.gatewayIds,
  ],
  (byId, ids): Gateway[] => ids.map(id => byId[id]).filter(Boolean)
);

export const selectGatewayCount = (s: RootState): number =>
  s.gatewayManagement.gatewayIds.length;

export const selectGatewayById = (gatewayId: string | null) =>
  (s: RootState): Gateway | null =>
    gatewayId ? s.gatewayManagement.gatewaysById[gatewayId] ?? null : null;

export const selectSelectedGatewayId = (s: RootState): string | null =>
  s.gatewayManagement.selection.selectedGatewayId;

export const selectSelectedGateway = createSelector(
  [
    (s: RootState) => s.gatewayManagement.selection.selectedGatewayId,
    (s: RootState) => s.gatewayManagement.gatewaysById,
  ],
  (id, byId): Gateway | null => (id ? byId[id] ?? null : null)
);

export const selectConnectedGateways = createSelector(
  [selectGateways],
  (gateways): Gateway[] => gateways.filter(g => g.connectionStatus === 'Connected')
);

export const selectErroredGateways = createSelector(
  [selectGateways],
  (gateways): Gateway[] => gateways.filter(g => g.connectionStatus === 'Error')
);

export const selectGatewaysByStatus = createSelector(
  [selectGateways],
  (gateways): Record<string, Gateway[]> => {
    const out: Record<string, Gateway[]> = {
      Disconnected: [],
      Connecting: [],
      Connected: [],
      Reconnecting: [],
      Error: [],
    };
    for (const g of gateways) {
      out[g.connectionStatus]?.push(g);
    }
    return out;
  }
);

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

export const selectStatusForGateway = (gatewayId: string | null) =>
  (s: RootState): GatewayStatus | null =>
    gatewayId ? s.gatewayManagement.statusByGatewayId[gatewayId] ?? null : null;

/* ------------------------------------------------------------------ */
/* Connections                                                         */
/* ------------------------------------------------------------------ */

export const selectConnectionsForGateway = (gatewayId: string | null) =>
  (s: RootState): GatewayConnection[] =>
    gatewayId ? s.gatewayManagement.connectionsByGatewayId[gatewayId] ?? [] : [];

/* ------------------------------------------------------------------ */
/* Operations                                                          */
/* ------------------------------------------------------------------ */

export const selectOperationsForGateway = (gatewayId: string | null) =>
  (s: RootState): GatewayOperation[] =>
    gatewayId ? s.gatewayManagement.operationsByGatewayId[gatewayId] ?? [] : [];

export const selectSelectedOperationId = (s: RootState): string | null =>
  s.gatewayManagement.selection.selectedOperationId;

export const selectSelectedOperation = createSelector(
  [
    (s: RootState) => s.gatewayManagement.selection.selectedOperationId,
    (s: RootState) => s.gatewayManagement.selection.selectedGatewayId,
    (s: RootState) => s.gatewayManagement.operationsByGatewayId,
  ],
  (opId, gwId, opsByGw): GatewayOperation | null => {
    if (!opId || !gwId) return null;
    return (opsByGw[gwId] ?? []).find(o => o.id === opId) ?? null;
  }
);

/* ------------------------------------------------------------------ */
/* Diagnostics                                                         */
/* ------------------------------------------------------------------ */

export const selectDiagnosticsForGateway = (gatewayId: string | null) =>
  (s: RootState): GatewayDiagnostics | null =>
    gatewayId ? s.gatewayManagement.diagnosticsByGatewayId[gatewayId] ?? null : null;

/* ------------------------------------------------------------------ */
/* Assignments                                                         */
/* ------------------------------------------------------------------ */

export const selectAssignmentsForGateway = (gatewayId: string | null) =>
  (s: RootState): GatewayAssignmentDto[] =>
    gatewayId ? s.gatewayManagement.assignmentsByGatewayId[gatewayId] ?? [] : [];

export const selectSelectedAssignmentId = (s: RootState): string | null =>
  s.gatewayManagement.selection.selectedAssignmentId;

/* ------------------------------------------------------------------ */
/* Integration                                                         */
/* ------------------------------------------------------------------ */

export const selectIntegrationState = (s: RootState) =>
  s.gatewayManagement.integrationState;

/* ------------------------------------------------------------------ */
/* Async + errors                                                      */
/* ------------------------------------------------------------------ */

export const selectAsyncFlags = (s: RootState) => s.gatewayManagement.async;
export const selectErrors = (s: RootState) => s.gatewayManagement.errors;

export const selectGatewaysError = (s: RootState): string | null =>
  s.gatewayManagement.errors.gateways;

export const selectSelectedGatewayError = (s: RootState): string | null =>
  s.gatewayManagement.errors.gateway;

export const selectConnectError = (s: RootState): string | null =>
  s.gatewayManagement.errors.connect;

export const selectDisconnectError = (s: RootState): string | null =>
  s.gatewayManagement.errors.disconnect;

export const selectReconnectError = (s: RootState): string | null =>
  s.gatewayManagement.errors.reconnect;

export const selectRegisterError = (s: RootState): string | null =>
  s.gatewayManagement.errors.register;

export const selectDiagnosticsError = (s: RootState): string | null =>
  s.gatewayManagement.errors.diagnostics;

export const selectAnyLoading = (s: RootState): boolean =>
  Object.values(s.gatewayManagement.async).some(Boolean);

export const selectFirstError = createSelector(
  [selectErrors],
  (errors): string | null =>
    errors.gateways ??
    errors.gateway ??
    errors.register ??
    errors.update ??
    errors.configure ??
    errors.connect ??
    errors.disconnect ??
    errors.reconnect ??
    errors.status ??
    errors.connections ??
    errors.operations ??
    errors.executeOperation ??
    errors.diagnostics ??
    errors.assignments ??
    errors.integration ??
    null
);