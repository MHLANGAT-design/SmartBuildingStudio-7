// src/modules/GatewayManagement/Store/gatewayManagementSlice.ts

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

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
import type { GatewayManagementContext } from '@/modules/GatewayManagement/Models/GatewayManagementContext';

import type {
  AsyncFlags,
  ErrorBag,
  GatewayManagementState,
  IntegrationState,
  SelectionState,
} from '@/modules/GatewayManagement/Store/gatewayManagementTypes';
import {
  INITIAL_ASYNC_FLAGS,
  INITIAL_ERRORS,
  INITIAL_SELECTION,
} from '@/modules/GatewayManagement/Store/gatewayManagementTypes';

const initialState: GatewayManagementState = {
  context: null,
  contextLoading: false,
  contextError: null,
  gatewaysById: {},
  gatewayIds: [],
  statusByGatewayId: {},
  connectionsByGatewayId: {},
  operationsByGatewayId: {},
  diagnosticsByGatewayId: {},
  assignmentsByGatewayId: {},
  integrationState: null,
  selection: INITIAL_SELECTION,
  async: INITIAL_ASYNC_FLAGS,
  errors: INITIAL_ERRORS,
  revision: 0,
};

const slice = createSlice({
  name: 'gatewayManagement',
  initialState,
  reducers: {
    /* ---- Context ---- */
    setContext(state, action: PayloadAction<GatewayManagementContext | null>) {
      state.context = action.payload;
      state.contextLoading = false;
      state.contextError = null;
      state.revision += 1;
    },
    setContextLoading(state, action: PayloadAction<boolean>) {
      state.contextLoading = action.payload;
    },
    setContextError(state, action: PayloadAction<string | null>) {
      state.contextError = action.payload;
      state.contextLoading = false;
    },

    /* ---- Selection ---- */
    selectGateway(state, action: PayloadAction<string | null>) {
      state.selection.selectedGatewayId = action.payload;
    },
    selectOperation(state, action: PayloadAction<string | null>) {
      state.selection.selectedOperationId = action.payload;
    },
    selectAssignment(state, action: PayloadAction<string | null>) {
      state.selection.selectedAssignmentId = action.payload;
    },

    /* ---- Gateways ---- */
    setGateways(state, action: PayloadAction<Gateway[]>) {
      const list = action.payload;
      state.gatewaysById = {};
      state.gatewayIds = [];
      for (const g of list) {
        state.gatewaysById[g.id] = g;
        state.gatewayIds.push(g.id);
      }
      state.revision += 1;
    },
    upsertGateway(state, action: PayloadAction<Gateway>) {
      const g = action.payload;
      if (!state.gatewaysById[g.id]) {
        state.gatewayIds.push(g.id);
      }
      state.gatewaysById[g.id] = g;
      state.revision += 1;
    },
    removeGateway(state, action: PayloadAction<string>) {
      const id = action.payload;
      delete state.gatewaysById[id];
      state.gatewayIds = state.gatewayIds.filter(x => x !== id);
      delete state.statusByGatewayId[id];
      delete state.connectionsByGatewayId[id];
      delete state.operationsByGatewayId[id];
      delete state.diagnosticsByGatewayId[id];
      delete state.assignmentsByGatewayId[id];
      if (state.selection.selectedGatewayId === id) {
        state.selection.selectedGatewayId = null;
      }
      state.revision += 1;
    },

    /* ---- Status ---- */
    setStatus(state, action: PayloadAction<GatewayStatus>) {
      state.statusByGatewayId[action.payload.gatewayId] = action.payload;
      state.revision += 1;
    },

    /* ---- Connections ---- */
    setConnections(
      state,
      action: PayloadAction<{ gatewayId: string; connections: GatewayConnection[] }>
    ) {
      state.connectionsByGatewayId[action.payload.gatewayId] = action.payload.connections;
      state.revision += 1;
    },

    /* ---- Operations ---- */
    setOperations(
      state,
      action: PayloadAction<{ gatewayId: string; operations: GatewayOperation[] }>
    ) {
      state.operationsByGatewayId[action.payload.gatewayId] = action.payload.operations;
      state.revision += 1;
    },
    upsertOperation(state, action: PayloadAction<GatewayOperation>) {
      const op = action.payload;
      const list = state.operationsByGatewayId[op.gatewayId] ?? [];
      const existing = list.findIndex(o => o.id === op.id);
      if (existing >= 0) list[existing] = op;
      else list.push(op);
      state.operationsByGatewayId[op.gatewayId] = list;
      state.revision += 1;
    },

    /* ---- Diagnostics ---- */
    setDiagnostics(state, action: PayloadAction<GatewayDiagnostics>) {
      state.diagnosticsByGatewayId[action.payload.gatewayId] = action.payload;
      state.revision += 1;
    },

    /* ---- Assignments ---- */
    setAssignments(
      state,
      action: PayloadAction<{ gatewayId: string; assignments: GatewayAssignmentDto[] }>
    ) {
      state.assignmentsByGatewayId[action.payload.gatewayId] = action.payload.assignments;
      state.revision += 1;
    },
    upsertAssignment(
      state,
      action: PayloadAction<{ gatewayId: string; assignment: GatewayAssignmentDto }>
    ) {
      const { gatewayId, assignment } = action.payload;
      const list = state.assignmentsByGatewayId[gatewayId] ?? [];
      const existing = list.findIndex(a => a.id === assignment.id);
      if (existing >= 0) list[existing] = assignment;
      else list.push(assignment);
      state.assignmentsByGatewayId[gatewayId] = list;
      state.revision += 1;
    },
    removeAssignment(
      state,
      action: PayloadAction<{ gatewayId: string; assignmentId: string }>
    ) {
      const { gatewayId, assignmentId } = action.payload;
      state.assignmentsByGatewayId[gatewayId] = (
        state.assignmentsByGatewayId[gatewayId] ?? []
      ).filter(a => a.id !== assignmentId);
      state.revision += 1;
    },

    /* ---- Integration ---- */
    setIntegrationState(state, action: PayloadAction<IntegrationState>) {
      state.integrationState = action.payload;
      state.revision += 1;
    },

    /* ---- Async flags ---- */
    setAsyncFlag(
      state,
      action: PayloadAction<{ flag: keyof AsyncFlags; value: boolean }>
    ) {
      state.async[action.payload.flag] = action.payload.value;
    },

    /* ---- Errors ---- */
    setError(
      state,
      action: PayloadAction<{ slot: keyof ErrorBag; message: string | null }>
    ) {
      state.errors[action.payload.slot] = action.payload.message;
    },
    clearErrors(state) {
      state.errors = INITIAL_ERRORS;
    },
    clearSelection(state) {
      state.selection = INITIAL_SELECTION;
    },

    /* ---- Full reset ---- */
    reset(state) {
      return initialState;
    },
  },
});

export const {
  setContext,
  setContextLoading,
  setContextError,
  selectGateway,
  selectOperation,
  selectAssignment,
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
  clearErrors,
  clearSelection,
  reset,
} = slice.actions;

export const gatewayManagementReducer = slice.reducer;
export default gatewayManagementReducer;