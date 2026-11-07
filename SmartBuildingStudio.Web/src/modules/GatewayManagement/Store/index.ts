// src/modules/GatewayManagement/Store/index.ts

export * from '@/modules/GatewayManagement/Store/gatewayManagementTypes';
export {
  gatewayManagementReducer,
  default as gatewayManagementReducerDefault,
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
} from '@/modules/GatewayManagement/Store/gatewayManagementSlice';

export * from '@/modules/GatewayManagement/Store/gatewayManagementSelectors';

export {
  fetchGateways,
  fetchGateway,
  registerGateway,
  updateGateway,
  configureGateway,
  deleteGateway,
  connectGateway,
  disconnectGateway,
  reconnectGateway,
  fetchGatewayStatus,
  fetchGatewayConnections,
  fetchGatewayOperations,
  executeGatewayOperation,
  fetchGatewayDiagnostics,
  runGatewayDiagnostics,
  fetchGatewayAssignments,
  assignGatewayToProject,
  unassignGatewayFromProject,
  fetchIntegrationState,
  pingGateway,
} from '@/modules/GatewayManagement/Store/gatewayManagementThunks';