// src/modules/GatewayManagement/index.ts

export { GatewayManagementPage } from '@/modules/GatewayManagement/GatewayManagementPage';
export { default as GatewayManagementPageDefault } from '@/modules/GatewayManagement/GatewayManagementPage';

export {
  gatewayManagementReducer,
  default as gatewayManagementReducerDefault,
} from '@/modules/GatewayManagement/Store/gatewayManagementSlice';

/* Hooks */
export { useGateways } from '@/modules/GatewayManagement/Hooks/useGateways';
export type { UseGatewaysReturn } from '@/modules/GatewayManagement/Hooks/useGateways';

export { useGatewayConnection } from '@/modules/GatewayManagement/Hooks/useGatewayConnection';
export type { UseGatewayConnectionReturn } from '@/modules/GatewayManagement/Hooks/useGatewayConnection';

export { useGatewayIntegration } from '@/modules/GatewayManagement/Hooks/useGatewayIntegration';
export type { UseGatewayIntegrationReturn } from '@/modules/GatewayManagement/Hooks/useGatewayIntegration';

export { useGatewayDiagnostics } from '@/modules/GatewayManagement/Hooks/useGatewayDiagnostics';
export type { UseGatewayDiagnosticsReturn } from '@/modules/GatewayManagement/Hooks/useGatewayDiagnostics';

/* Models */
export type {
  Gateway,
  TransportProtocol,
  DaliProtocol,
  ConnectionStatus,
} from '@/modules/GatewayManagement/Models/Gateway';

export type {
  GatewayConnection,
  GatewayStatus,
} from '@/modules/GatewayManagement/Models/GatewayConnection';

export type {
  GatewayOperation,
  GatewayOperationType,
  GatewayDiagnostics,
  GatewayDiagnosticCheck,
} from '@/modules/GatewayManagement/Models/GatewayOperation';

export type { GatewayConfiguration } from '@/modules/GatewayManagement/Models/GatewayConfiguration';

/* Request types */
export type {
  RegisterGatewayRequest,
  UpdateGatewayRequest,
  ConfigureGatewayRequest,
  ExecuteGatewayOperationRequest,
  RunGatewayDiagnosticsRequest,
  AssignGatewayToProjectRequest,
} from '@/modules/GatewayManagement/Types';

/* Selectors (for cross-module reads) */
export {
  selectGateways,
  selectConnectedGateways,
  selectGatewayById,
  selectSelectedGatewayId,
  selectGatewayCount,
} from '@/modules/GatewayManagement/Store/gatewayManagementSelectors';

/* Public thunks (for cross-module orchestration, e.g. boot-time fetch) */
export {
  fetchGateways,
  fetchGatewayAssignments,
  assignGatewayToProject,
  unassignGatewayFromProject,
} from '@/modules/GatewayManagement/Store/gatewayManagementThunks';

/* Helpers */
export {
  formatGatewayEndpoint,
  isGatewayConnected,
  isGatewayTransitioning,
  isGatewayErrored,
  canConnect,
  canDisconnect,
  canReconnect,
} from '@/modules/GatewayManagement/Models/Gateway';