// src/modules/GatewayManagement/Types/Gateway.types.ts

/**
 * Raw DTO shapes mirroring
 * GatewayManagementService.Api.Contracts.Responses.GatewayResponse
 * and RegisterGatewayRequest / UpdateGatewayRequest / ConfigureGatewayRequest.
 *
 * These are what the API actually returns. Never consumed directly by
 * components — the API layer maps these into Models/Gateway.ts.
 */

export interface GatewayDto {
  id?: string;
  name?: string | null;
  identifier?: string | null;
  transport?: string | null;
  daliProtocol?: string | null;
  endpointHost?: string | null;
  endpointPort?: number;
  endpointPath?: string | null;
  connectionStatus?: string | null;
  lastConnectedAt?: string | null;
  lastSeenAt?: string | null;
  lastErrorMessage?: string | null;
  daliLineCount?: number;
  pollingIntervalSeconds?: number;
  commandTimeoutSeconds?: number;
}

export interface GatewayStatusDto {
  gatewayId?: string;
  connectionStatus?: string | null;
  lastConnectedAt?: string | null;
  lastSeenAt?: string | null;
  lastErrorMessage?: string | null;
  isReachable?: boolean;
}

export interface GatewayOperationDto {
  id?: string;
  gatewayId?: string;
  operationType?: string | null;
  payload?: string | null;
  result?: string | null;
  succeeded?: boolean;
  startedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
}

export interface GatewayDiagnosticsDto {
  gatewayId?: string;
  isHealthy?: boolean;
  latencyMs?: number;
  errorMessage?: string | null;
  checkedAt?: string | null;
  checks?: GatewayDiagnosticCheckDto[] | null;
}

export interface GatewayDiagnosticCheckDto {
  name?: string | null;
  passed?: boolean;
  latencyMs?: number;
  detail?: string | null;
}

export interface GatewayConnectionDto {
  id?: string;
  connectedAt?: string | null;
  disconnectedAt?: string | null;
  disconnectReason?: string | null;
  remoteEndpoint?: string | null;
  isOpen?: boolean;
}

export interface GatewayAssignmentDto {
  id?: string;
  gatewayId?: string;
  projectId?: string;
  floorId?: string | null;
  daliNetworkId?: string | null;
  assignedAt?: string | null;
}

/** Request payloads — sent to the API. */

export interface RegisterGatewayRequest {
  name: string;
  identifier: string;
  transport: string;
  daliProtocol: string;
  endpointHost: string;
  endpointPort: number;
  endpointPath: string | null;
  daliLineCount: number;
  pollingIntervalSeconds: number;
  commandTimeoutSeconds: number;
  authToken: string | null;
}

export interface UpdateGatewayRequest {
  name: string;
  endpointHost: string;
  endpointPort: number;
  endpointPath: string | null;
}

export interface ConfigureGatewayRequest {
  daliLineCount: number;
  pollingIntervalSeconds: number;
  commandTimeoutSeconds: number;
  authToken: string | null;
}

export interface ExecuteGatewayOperationRequest {
  operationType: string;
  payload: string | null;
}

export interface RunGatewayDiagnosticsRequest {
  includeFullChecks: boolean;
}

export interface AssignGatewayToProjectRequest {
  projectId: string;
  floorId: string | null;
  daliNetworkId: string | null;
}