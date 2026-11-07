// src/modules/GatewayManagement/Store/gatewayManagementTypes.ts

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

/** Per-request async flags. One entry per thunk. */
export interface AsyncFlags {
  fetchGateways: boolean;
  fetchGateway: boolean;
  registerGateway: boolean;
  updateGateway: boolean;
  configureGateway: boolean;
  connectGateway: boolean;
  disconnectGateway: boolean;
  reconnectGateway: boolean;
  fetchStatus: boolean;
  fetchConnections: boolean;
  fetchOperations: boolean;
  executeOperation: boolean;
  fetchDiagnostics: boolean;
  runDiagnostics: boolean;
  fetchAssignments: boolean;
  assignGateway: boolean;
  unassignGateway: boolean;
  fetchIntegrationState: boolean;
  pingGateway: boolean;
}

export const INITIAL_ASYNC_FLAGS: AsyncFlags = {
  fetchGateways: false,
  fetchGateway: false,
  registerGateway: false,
  updateGateway: false,
  configureGateway: false,
  connectGateway: false,
  disconnectGateway: false,
  reconnectGateway: false,
  fetchStatus: false,
  fetchConnections: false,
  fetchOperations: false,
  executeOperation: false,
  fetchDiagnostics: false,
  runDiagnostics: false,
  fetchAssignments: false,
  assignGateway: false,
  unassignGateway: false,
  fetchIntegrationState: false,
  pingGateway: false,
};

/** Selection state — the id the user has clicked on. */
export interface SelectionState {
  selectedGatewayId: string | null;
  selectedOperationId: string | null;
  selectedAssignmentId: string | null;
}

export const INITIAL_SELECTION: SelectionState = {
  selectedGatewayId: null,
  selectedOperationId: null,
  selectedAssignmentId: null,
};

/** Error bag — one slot per flow. */
export interface ErrorBag {
  gateways: string | null;
  gateway: string | null;
  register: string | null;
  update: string | null;
  configure: string | null;
  connect: string | null;
  disconnect: string | null;
  reconnect: string | null;
  status: string | null;
  connections: string | null;
  operations: string | null;
  executeOperation: string | null;
  diagnostics: string | null;
  assignments: string | null;
  integration: string | null;
}

export const INITIAL_ERRORS: ErrorBag = {
  gateways: null,
  gateway: null,
  register: null,
  update: null,
  configure: null,
  connect: null,
  disconnect: null,
  reconnect: null,
  status: null,
  connections: null,
  operations: null,
  executeOperation: null,
  diagnostics: null,
  assignments: null,
  integration: null,
};

/** Integration state (from GatewayIntegration/state endpoint). */
export interface IntegrationState {
  useMock: boolean;
  healthCheckIntervalSeconds: number;
  maxReconnectAttempts: number;
}

/**
 * The full slice state.
 */
export interface GatewayManagementState {
  /** The project/building/floor/document context for this page. */
  context: GatewayManagementContext | null;
  contextLoading: boolean;
  contextError: string | null;

  /** Gateways by id + ordered id list. */
  gatewaysById: Record<string, Gateway>;
  gatewayIds: string[];

  /** Current status per gateway (from /status endpoint). */
  statusByGatewayId: Record<string, GatewayStatus>;

  /** Connection history per gateway. */
  connectionsByGatewayId: Record<string, GatewayConnection[]>;

  /** Operations log per gateway. */
  operationsByGatewayId: Record<string, GatewayOperation[]>;

  /** Latest diagnostics result per gateway. */
  diagnosticsByGatewayId: Record<string, GatewayDiagnostics>;

  /** Assignments per gateway. */
  assignmentsByGatewayId: Record<string, GatewayAssignmentDto[]>;

  /** Integration runtime state. */
  integrationState: IntegrationState | null;

  selection: SelectionState;
  async: AsyncFlags;
  errors: ErrorBag;

  /** Monotonic counter incremented on every successful state-changing fetch. */
  revision: number;
}