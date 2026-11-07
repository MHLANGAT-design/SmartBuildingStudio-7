// src/modules/GatewayManagement/Store/gatewayManagementThunks.ts

/**
 * Async thunks for GatewayManagement.
 *
 * Conventions:
 *   - every thunk sets its async flag on/off via withFlag(),
 *   - clears its error slot on start, writes it on failure,
 *   - rethrows on failure so callers can await and catch,
 *   - dispatches slice actions for state updates inside the payload creator.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from '@/Application/ConfigureStore';

import { GatewayRegistryService } from '@/modules/GatewayManagement/Services/GatewayRegistryService';
import { GatewayConnectionService } from '@/modules/GatewayManagement/Services/GatewayConnectionService';
import { GatewayIntegrationService } from '@/modules/GatewayManagement/Services/GatewayIntegrationService';
import { GatewayDiagnosticsService } from '@/modules/GatewayManagement/Services/GatewayDiagnosticsService';
import { GatewayManagementApi } from '@/modules/GatewayManagement/Services/GatewayManagementApi';

import type { Gateway } from '@/modules/GatewayManagement/Models/Gateway';
import type {
  GatewayConnection,
  GatewayStatus,
} from '@/modules/GatewayManagement/Models/GatewayConnection';
import type {
  GatewayOperation,
  GatewayDiagnostics,
} from '@/modules/GatewayManagement/Models/GatewayOperation';
import type {
  RegisterGatewayRequest,
  UpdateGatewayRequest,
  ConfigureGatewayRequest,
  ExecuteGatewayOperationRequest,
  AssignGatewayToProjectRequest,
  GatewayAssignmentDto,
} from '@/modules/GatewayManagement/Types';

import {
  setGateways,
  upsertGateway,
  removeGateway,
  setStatus,
  setConnections,
  setOperations,
  upsertOperation,
  setDiagnostics,
  setAssignments,
  upsertAssignment,
  removeAssignment,
  setIntegrationState,
  setAsyncFlag,
  setError,
} from '@/modules/GatewayManagement/Store/gatewayManagementSlice';

import type {
  AsyncFlags,
  ErrorBag,
  IntegrationState,
} from '@/modules/GatewayManagement/Store/gatewayManagementTypes';

type GDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;

const toMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

const withFlag = async <T>(
  dispatch: GDispatch,
  flag: keyof AsyncFlags,
  slot: keyof ErrorBag,
  fn: () => Promise<T>
): Promise<T> => {
  dispatch(setAsyncFlag({ flag, value: true }));
  dispatch(setError({ slot, message: null }));
  try {
    return await fn();
  } catch (err) {
    dispatch(setError({ slot, message: toMessage(err) }));
    throw err;
  } finally {
    dispatch(setAsyncFlag({ flag, value: false }));
  }
};

const guard = (
  dispatch: GDispatch,
  slot: keyof ErrorBag,
  condition: unknown,
  message: string
): void => {
  if (!condition) {
    dispatch(setError({ slot, message }));
    throw new Error(message);
  }
};

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

export const fetchGateways = createAsyncThunk<
  Gateway[],
  void,
  { state: RootState }
>('gatewayManagement/fetchGateways', async (_args, { dispatch }) => {
  const list = await withFlag(dispatch, 'fetchGateways', 'gateways', () =>
    GatewayRegistryService.list()
  );
  dispatch(setGateways(list));
  return list;
});

export const fetchGateway = createAsyncThunk<
  Gateway,
  { gatewayId: string },
  { state: RootState }
>('gatewayManagement/fetchGateway', async (args, { dispatch }) => {
  guard(dispatch, 'gateway', args.gatewayId, 'A gateway id is required.');
  const gateway = await withFlag(dispatch, 'fetchGateway', 'gateway', () =>
    GatewayRegistryService.get(args.gatewayId)
  );
  dispatch(upsertGateway(gateway));
  return gateway;
});

export const registerGateway = createAsyncThunk<
  Gateway,
  RegisterGatewayRequest,
  { state: RootState }
>('gatewayManagement/registerGateway', async (req, { dispatch }) => {
  const gateway = await withFlag(dispatch, 'registerGateway', 'register', () =>
    GatewayRegistryService.register(req)
  );
  dispatch(upsertGateway(gateway));
  return gateway;
});

export const updateGateway = createAsyncThunk<
  Gateway,
  { gatewayId: string; request: UpdateGatewayRequest },
  { state: RootState }
>('gatewayManagement/updateGateway', async (args, { dispatch }) => {
  guard(dispatch, 'update', args.gatewayId, 'A gateway id is required.');
  const gateway = await withFlag(dispatch, 'updateGateway', 'update', () =>
    GatewayRegistryService.update(args.gatewayId, args.request)
  );
  dispatch(upsertGateway(gateway));
  return gateway;
});

export const configureGateway = createAsyncThunk<
  Gateway,
  { gatewayId: string; request: ConfigureGatewayRequest },
  { state: RootState }
>('gatewayManagement/configureGateway', async (args, { dispatch }) => {
  guard(dispatch, 'configure', args.gatewayId, 'A gateway id is required.');
  const gateway = await withFlag(dispatch, 'configureGateway', 'configure', () =>
    GatewayRegistryService.configure(args.gatewayId, args.request)
  );
  dispatch(upsertGateway(gateway));
  return gateway;
});

export const deleteGateway = createAsyncThunk<
  string,
  { gatewayId: string },
  { state: RootState }
>('gatewayManagement/deleteGateway', async (args, { dispatch }) => {
  guard(dispatch, 'gateways', args.gatewayId, 'A gateway id is required.');
  // Backend does not currently expose DELETE /gateways/{id}; keep the
  // action for future use. For now, remove from local state only.
  dispatch(removeGateway(args.gatewayId));
  return args.gatewayId;
});

/* ------------------------------------------------------------------ */
/* Connections                                                         */
/* ------------------------------------------------------------------ */

export const connectGateway = createAsyncThunk<
  Gateway | null,
  { gatewayId: string },
  { state: RootState }
>('gatewayManagement/connectGateway', async (args, { dispatch, getState }) => {
  guard(dispatch, 'connect', args.gatewayId, 'A gateway id is required.');
  await withFlag(dispatch, 'connectGateway', 'connect', () =>
    GatewayConnectionService.connect(args.gatewayId)
  );
  // Refresh status + gateway after connect
  try {
    const status = await GatewayConnectionService.getStatus(args.gatewayId);
    dispatch(setStatus(status));
  } catch {
    /* non-fatal — status will update on next poll */
  }
  try {
    const gateway = await GatewayRegistryService.get(args.gatewayId);
    dispatch(upsertGateway(gateway));
    return gateway;
  } catch {
    return null;
  }
});

export const disconnectGateway = createAsyncThunk<
  Gateway | null,
  { gatewayId: string; reason?: string | null },
  { state: RootState }
>('gatewayManagement/disconnectGateway', async (args, { dispatch }) => {
  guard(dispatch, 'disconnect', args.gatewayId, 'A gateway id is required.');
  await withFlag(dispatch, 'disconnectGateway', 'disconnect', () =>
    GatewayConnectionService.disconnect(args.gatewayId, args.reason)
  );
  try {
    const status = await GatewayConnectionService.getStatus(args.gatewayId);
    dispatch(setStatus(status));
  } catch {
    /* non-fatal */
  }
  try {
    const gateway = await GatewayRegistryService.get(args.gatewayId);
    dispatch(upsertGateway(gateway));
    return gateway;
  } catch {
    return null;
  }
});

export const reconnectGateway = createAsyncThunk<
  Gateway | null,
  { gatewayId: string },
  { state: RootState }
>('gatewayManagement/reconnectGateway', async (args, { dispatch }) => {
  guard(dispatch, 'reconnect', args.gatewayId, 'A gateway id is required.');
  await withFlag(dispatch, 'reconnectGateway', 'reconnect', () =>
    GatewayConnectionService.reconnect(args.gatewayId)
  );
  try {
    const status = await GatewayConnectionService.getStatus(args.gatewayId);
    dispatch(setStatus(status));
  } catch {
    /* non-fatal */
  }
  try {
    const gateway = await GatewayRegistryService.get(args.gatewayId);
    dispatch(upsertGateway(gateway));
    return gateway;
  } catch {
    return null;
  }
});

export const fetchGatewayStatus = createAsyncThunk<
  GatewayStatus,
  { gatewayId: string },
  { state: RootState }
>('gatewayManagement/fetchGatewayStatus', async (args, { dispatch }) => {
  guard(dispatch, 'status', args.gatewayId, 'A gateway id is required.');
  const status = await withFlag(dispatch, 'fetchStatus', 'status', () =>
    GatewayConnectionService.getStatus(args.gatewayId)
  );
  dispatch(setStatus(status));
  return status;
});

export const fetchGatewayConnections = createAsyncThunk<
  GatewayConnection[],
  { gatewayId: string },
  { state: RootState }
>('gatewayManagement/fetchGatewayConnections', async (args, { dispatch }) => {
  guard(dispatch, 'connections', args.gatewayId, 'A gateway id is required.');
  const connections = await withFlag(dispatch, 'fetchConnections', 'connections', () =>
    GatewayConnectionService.listHistory(args.gatewayId)
  );
  dispatch(setConnections({ gatewayId: args.gatewayId, connections }));
  return connections;
});

/* ------------------------------------------------------------------ */
/* Operations                                                          */
/* ------------------------------------------------------------------ */

export const fetchGatewayOperations = createAsyncThunk<
  GatewayOperation[],
  { gatewayId: string },
  { state: RootState }
>('gatewayManagement/fetchGatewayOperations', async (args, { dispatch }) => {
  guard(dispatch, 'operations', args.gatewayId, 'A gateway id is required.');
  const operations = await withFlag(dispatch, 'fetchOperations', 'operations', () =>
    GatewayManagementApi.listOperations(args.gatewayId)
  );
  dispatch(setOperations({ gatewayId: args.gatewayId, operations }));
  return operations;
});

export const executeGatewayOperation = createAsyncThunk<
  GatewayOperation,
  { gatewayId: string; request: ExecuteGatewayOperationRequest },
  { state: RootState }
>('gatewayManagement/executeGatewayOperation', async (args, { dispatch }) => {
  guard(dispatch, 'executeOperation', args.gatewayId, 'A gateway id is required.');
  const operation = await withFlag(dispatch, 'executeOperation', 'executeOperation', () =>
    GatewayManagementApi.executeOperation(args.gatewayId, args.request)
  );
  dispatch(upsertOperation(operation));
  return operation;
});

/* ------------------------------------------------------------------ */
/* Diagnostics                                                         */
/* ------------------------------------------------------------------ */

export const fetchGatewayDiagnostics = createAsyncThunk<
  GatewayDiagnostics,
  { gatewayId: string },
  { state: RootState }
>('gatewayManagement/fetchGatewayDiagnostics', async (args, { dispatch }) => {
  guard(dispatch, 'diagnostics', args.gatewayId, 'A gateway id is required.');
  const diagnostics = await withFlag(dispatch, 'fetchDiagnostics', 'diagnostics', () =>
    GatewayDiagnosticsService.get(args.gatewayId)
  );
  dispatch(setDiagnostics(diagnostics));
  return diagnostics;
});

export const runGatewayDiagnostics = createAsyncThunk<
  GatewayDiagnostics,
  { gatewayId: string },
  { state: RootState }
>('gatewayManagement/runGatewayDiagnostics', async (args, { dispatch }) => {
  guard(dispatch, 'diagnostics', args.gatewayId, 'A gateway id is required.');
  const diagnostics = await withFlag(dispatch, 'runDiagnostics', 'diagnostics', () =>
    GatewayDiagnosticsService.run(args.gatewayId)
  );
  dispatch(setDiagnostics(diagnostics));
  return diagnostics;
});

/* ------------------------------------------------------------------ */
/* Assignments                                                         */
/* ------------------------------------------------------------------ */

export const fetchGatewayAssignments = createAsyncThunk<
  GatewayAssignmentDto[],
  { gatewayId: string },
  { state: RootState }
>('gatewayManagement/fetchGatewayAssignments', async (args, { dispatch }) => {
  guard(dispatch, 'assignments', args.gatewayId, 'A gateway id is required.');
  const assignments = await withFlag(dispatch, 'fetchAssignments', 'assignments', () =>
    GatewayManagementApi.listAssignments(args.gatewayId)
  );
  dispatch(setAssignments({ gatewayId: args.gatewayId, assignments }));
  return assignments;
});

export const assignGatewayToProject = createAsyncThunk<
  GatewayAssignmentDto,
  { gatewayId: string; request: AssignGatewayToProjectRequest },
  { state: RootState }
>('gatewayManagement/assignGatewayToProject', async (args, { dispatch }) => {
  guard(dispatch, 'assignments', args.gatewayId, 'A gateway id is required.');
  const assignment = await withFlag(dispatch, 'assignGateway', 'assignments', () =>
    GatewayManagementApi.assignGateway(args.gatewayId, args.request)
  );
  dispatch(upsertAssignment({ gatewayId: args.gatewayId, assignment }));
  return assignment;
});

export const unassignGatewayFromProject = createAsyncThunk<
  { gatewayId: string; assignmentId: string },
  { gatewayId: string; assignmentId: string },
  { state: RootState }
>('gatewayManagement/unassignGatewayFromProject', async (args, { dispatch }) => {
  guard(dispatch, 'assignments', args.gatewayId, 'A gateway id is required.');
  guard(dispatch, 'assignments', args.assignmentId, 'An assignment id is required.');
  await withFlag(dispatch, 'unassignGateway', 'assignments', () =>
    GatewayManagementApi.unassignGateway(args.gatewayId, args.assignmentId)
  );
  dispatch(removeAssignment({
    gatewayId: args.gatewayId,
    assignmentId: args.assignmentId,
  }));
  return args;
});

/* ------------------------------------------------------------------ */
/* Integration                                                         */
/* ------------------------------------------------------------------ */

export const fetchIntegrationState = createAsyncThunk<
  IntegrationState,
  void,
  { state: RootState }
>('gatewayManagement/fetchIntegrationState', async (_args, { dispatch }) => {
  const state = await withFlag(dispatch, 'fetchIntegrationState', 'integration', () =>
    GatewayIntegrationService.getState()
  );
  dispatch(setIntegrationState(state));
  return state;
});

export const pingGateway = createAsyncThunk<
  { gatewayId: string; reachable: boolean },
  { gatewayId: string },
  { state: RootState }
>('gatewayManagement/pingGateway', async (args, { dispatch }) => {
  guard(dispatch, 'integration', args.gatewayId, 'A gateway id is required.');
  const reachable = await withFlag(dispatch, 'pingGateway', 'integration', () =>
    GatewayIntegrationService.ping(args.gatewayId)
  );
  return { gatewayId: args.gatewayId, reachable };
});