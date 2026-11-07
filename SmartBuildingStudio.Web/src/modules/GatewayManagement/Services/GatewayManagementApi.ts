// src/modules/GatewayManagement/Services/GatewayManagementApi.ts

/**
 * Fetch layer for GatewayManagement.
 *
 * Every method:
 *   - returns a frontend Model (never a raw DTO),
 *   - maps incomplete backend payloads with defaults so a backend
 *     regression cannot crash a dialog,
 *   - returns `undefined` for endpoints that respond 204 No Content
 *     (connect / disconnect / reconnect / unassign).
 *
 * Mock bypass: when USE_MOCK is true, returns synthetic data. The
 * GatewayManagement backend is live, so this is only used for tests.
 */

import { USE_MOCK, mockDelay, nowIso, jsonFetch } from '@/modules/GatewayManagement/Services/apiConfig';

import type {
  GatewayDto,
  GatewayStatusDto,
  GatewayOperationDto,
  GatewayDiagnosticsDto,
  GatewayConnectionDto,
  GatewayAssignmentDto,
  RegisterGatewayRequest,
  UpdateGatewayRequest,
  ConfigureGatewayRequest,
  ExecuteGatewayOperationRequest,
  RunGatewayDiagnosticsRequest,
  AssignGatewayToProjectRequest,
} from '@/modules/GatewayManagement/Types';

import type { Gateway } from '@/modules/GatewayManagement/Models/Gateway';
import {
  createEmptyGateway,
  asTransport,
  asDaliProtocol,
  asConnectionStatus,
} from '@/modules/GatewayManagement/Models/Gateway';

import type {
  GatewayConnection,
  GatewayStatus,
} from '@/modules/GatewayManagement/Models/GatewayConnection';
import {
  createEmptyGatewayConnection,
  createEmptyGatewayStatus,
} from '@/modules/GatewayManagement/Models/GatewayConnection';

import type { GatewayOperation, GatewayDiagnostics } from '@/modules/GatewayManagement/Models/GatewayOperation';
import {
  createEmptyGatewayOperation,
  createEmptyGatewayDiagnostics,
} from '@/modules/GatewayManagement/Models/GatewayOperation';

/* ------------------------------------------------------------------ */
/* DTO -> Model mappers                                                */
/* ------------------------------------------------------------------ */

export const mapGatewayDto = (dto: GatewayDto | null | undefined): Gateway => {
  const d = dto ?? {};
  return createEmptyGateway({
    id: d.id ?? '',
    name: d.name ?? '',
    identifier: d.identifier ?? '',
    transport: asTransport(d.transport),
    daliProtocol: asDaliProtocol(d.daliProtocol),
    endpointHost: d.endpointHost ?? '',
    endpointPort: d.endpointPort ?? 0,
    endpointPath: d.endpointPath ?? null,
    connectionStatus: asConnectionStatus(d.connectionStatus),
    lastConnectedAt: d.lastConnectedAt ?? null,
    lastSeenAt: d.lastSeenAt ?? null,
    lastErrorMessage: d.lastErrorMessage ?? null,
    daliLineCount: d.daliLineCount ?? 1,
    pollingIntervalSeconds: d.pollingIntervalSeconds ?? 15,
    commandTimeoutSeconds: d.commandTimeoutSeconds ?? 30,
  });
};

export const mapStatusDto = (dto: GatewayStatusDto | null | undefined): GatewayStatus => {
  const d = dto ?? {};
  return createEmptyGatewayStatus({
    gatewayId: d.gatewayId ?? '',
    connectionStatus: asConnectionStatus(d.connectionStatus),
    lastConnectedAt: d.lastConnectedAt ?? null,
    lastSeenAt: d.lastSeenAt ?? null,
    lastErrorMessage: d.lastErrorMessage ?? null,
    isReachable: d.isReachable ?? false,
  });
};

export const mapConnectionDto = (
  dto: GatewayConnectionDto | null | undefined
): GatewayConnection => {
  const d = dto ?? {};
  return createEmptyGatewayConnection({
    id: d.id ?? '',
    connectedAt: d.connectedAt ?? nowIso(),
    disconnectedAt: d.disconnectedAt ?? null,
    disconnectReason: d.disconnectReason ?? null,
    remoteEndpoint: d.remoteEndpoint ?? null,
    isOpen: d.isOpen ?? false,
  });
};

export const mapOperationDto = (
  dto: GatewayOperationDto | null | undefined
): GatewayOperation => {
  const d = dto ?? {};
  return createEmptyGatewayOperation({
    id: d.id ?? '',
    gatewayId: d.gatewayId ?? '',
    operationType: d.operationType ?? 'ExecuteOperation',
    payload: d.payload ?? null,
    result: d.result ?? null,
    succeeded: d.succeeded ?? false,
    startedAt: d.startedAt ?? nowIso(),
    completedAt: d.completedAt ?? null,
    errorMessage: d.errorMessage ?? null,
  });
};

export const mapDiagnosticsDto = (
  dto: GatewayDiagnosticsDto | null | undefined
): GatewayDiagnostics => {
  const d = dto ?? {};
  return createEmptyGatewayDiagnostics({
    gatewayId: d.gatewayId ?? '',
    isHealthy: d.isHealthy ?? false,
    latencyMs: d.latencyMs ?? 0,
    errorMessage: d.errorMessage ?? null,
    checkedAt: d.checkedAt ?? nowIso(),
    checks: (d.checks ?? []).map(c => ({
      name: c.name ?? '',
      passed: c.passed ?? false,
      latencyMs: c.latencyMs ?? 0,
      detail: c.detail ?? null,
    })),
  });
};

export const mapAssignmentDto = (
  dto: GatewayAssignmentDto | null | undefined
) => {
  const d = dto ?? {};
  return {
    id: d.id ?? '',
    gatewayId: d.gatewayId ?? '',
    projectId: d.projectId ?? '',
    floorId: d.floorId ?? null,
    daliNetworkId: d.daliNetworkId ?? null,
    assignedAt: d.assignedAt ?? nowIso(),
  };
};

/* ------------------------------------------------------------------ */
/* API client                                                          */
/* ------------------------------------------------------------------ */

export const GatewayManagementApi = {
  /* ---- Registry ---- */

  async listGateways(): Promise<Gateway[]> {
    if (USE_MOCK) {
      await mockDelay();
      return [];
    }
    const dtos = await jsonFetch<GatewayDto[]>('/api/v1/gateways');
    return (dtos ?? []).map(mapGatewayDto);
  },

  async getGateway(id: string): Promise<Gateway> {
    if (USE_MOCK) {
      await mockDelay();
      return mapGatewayDto({ id });
    }
    const dto = await jsonFetch<GatewayDto>(
      `/api/v1/gateways/${encodeURIComponent(id)}`
    );
    return mapGatewayDto(dto);
  },

  async registerGateway(req: RegisterGatewayRequest): Promise<Gateway> {
    if (USE_MOCK) {
      await mockDelay();
      return mapGatewayDto({
        id: `gw-${Date.now()}`,
        name: req.name,
        identifier: req.identifier,
        transport: req.transport,
        daliProtocol: req.daliProtocol,
        endpointHost: req.endpointHost,
        endpointPort: req.endpointPort,
        endpointPath: req.endpointPath,
        connectionStatus: 'Disconnected',
        daliLineCount: req.daliLineCount,
        pollingIntervalSeconds: req.pollingIntervalSeconds,
        commandTimeoutSeconds: req.commandTimeoutSeconds,
      });
    }
    const dto = await jsonFetch<GatewayDto>('/api/v1/gateways', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    return mapGatewayDto(dto);
  },

  async updateGateway(id: string, req: UpdateGatewayRequest): Promise<Gateway> {
    if (USE_MOCK) {
      await mockDelay();
      return mapGatewayDto({ id, ...req });
    }
    const dto = await jsonFetch<GatewayDto>(
      `/api/v1/gateways/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(req) }
    );
    return mapGatewayDto(dto);
  },

  async configureGateway(id: string, req: ConfigureGatewayRequest): Promise<Gateway> {
    if (USE_MOCK) {
      await mockDelay();
      return mapGatewayDto({ id });
    }
    const dto = await jsonFetch<GatewayDto>(
      `/api/v1/gateways/${encodeURIComponent(id)}/configuration`,
      { method: 'PUT', body: JSON.stringify(req) }
    );
    return mapGatewayDto(dto);
  },

  /* ---- Connections ---- */

  async connect(id: string): Promise<void> {
    if (USE_MOCK) {
      await mockDelay();
      return;
    }
    await jsonFetch<void>(`/api/v1/gateways/${encodeURIComponent(id)}/connect`, {
      method: 'POST',
    });
  },

  async disconnect(id: string, reason?: string | null): Promise<void> {
    if (USE_MOCK) {
      await mockDelay();
      return;
    }
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    await jsonFetch<void>(
      `/api/v1/gateways/${encodeURIComponent(id)}/disconnect${query}`,
      { method: 'POST' }
    );
  },

  async reconnect(id: string): Promise<void> {
    if (USE_MOCK) {
      await mockDelay();
      return;
    }
    await jsonFetch<void>(
      `/api/v1/gateways/${encodeURIComponent(id)}/reconnect`,
      { method: 'POST' }
    );
  },

  async getStatus(id: string): Promise<GatewayStatus> {
    if (USE_MOCK) {
      await mockDelay();
      return mapStatusDto({ gatewayId: id, connectionStatus: 'Disconnected' });
    }
    const dto = await jsonFetch<GatewayStatusDto>(
      `/api/v1/gateways/${encodeURIComponent(id)}/status`
    );
    return mapStatusDto(dto);
  },

  async listConnections(id: string): Promise<GatewayConnection[]> {
    if (USE_MOCK) {
      await mockDelay();
      return [];
    }
    const dtos = await jsonFetch<GatewayConnectionDto[]>(
      `/api/v1/gateways/${encodeURIComponent(id)}/connections`
    );
    return (dtos ?? []).map(mapConnectionDto);
  },

  /* ---- Operations ---- */

  async listOperations(id: string): Promise<GatewayOperation[]> {
    if (USE_MOCK) {
      await mockDelay();
      return [];
    }
    const dtos = await jsonFetch<GatewayOperationDto[]>(
      `/api/v1/gateways/${encodeURIComponent(id)}/operations`
    );
    return (dtos ?? []).map(mapOperationDto);
  },

  async executeOperation(
    id: string,
    req: ExecuteGatewayOperationRequest
  ): Promise<GatewayOperation> {
    if (USE_MOCK) {
      await mockDelay();
      return mapOperationDto({
        id: `op-${Date.now()}`,
        gatewayId: id,
        operationType: req.operationType,
        payload: req.payload,
        succeeded: true,
        startedAt: nowIso(),
        completedAt: nowIso(),
      });
    }
    const dto = await jsonFetch<GatewayOperationDto>(
      `/api/v1/gateways/${encodeURIComponent(id)}/operations`,
      { method: 'POST', body: JSON.stringify(req) }
    );
    return mapOperationDto(dto);
  },

  /* ---- Diagnostics ---- */

  async getDiagnostics(id: string): Promise<GatewayDiagnostics> {
    if (USE_MOCK) {
      await mockDelay();
      return mapDiagnosticsDto({ gatewayId: id });
    }
    const dto = await jsonFetch<GatewayDiagnosticsDto>(
      `/api/v1/gateways/${encodeURIComponent(id)}/diagnostics`
    );
    return mapDiagnosticsDto(dto);
  },

  async runDiagnostics(
    id: string,
    req: RunGatewayDiagnosticsRequest = { includeFullChecks: true }
  ): Promise<GatewayDiagnostics> {
    if (USE_MOCK) {
      await mockDelay();
      return mapDiagnosticsDto({
        gatewayId: id,
        isHealthy: true,
        latencyMs: 40,
        checkedAt: nowIso(),
        checks: [{ name: 'Ping', passed: true, latencyMs: 40 }],
      });
    }
    const dto = await jsonFetch<GatewayDiagnosticsDto>(
      `/api/v1/gateways/${encodeURIComponent(id)}/diagnostics/run`,
      { method: 'POST', body: JSON.stringify(req) }
    );
    return mapDiagnosticsDto(dto);
  },

  /* ---- Assignments ---- */

  async listAssignments(id: string) {
    if (USE_MOCK) {
      await mockDelay();
      return [];
    }
    const dtos = await jsonFetch<GatewayAssignmentDto[]>(
      `/api/v1/gateways/${encodeURIComponent(id)}/assignments`
    );
    return (dtos ?? []).map(mapAssignmentDto);
  },

  async assignGateway(id: string, req: AssignGatewayToProjectRequest) {
    if (USE_MOCK) {
      await mockDelay();
      return mapAssignmentDto({
        id: `asg-${Date.now()}`,
        gatewayId: id,
        projectId: req.projectId,
        floorId: req.floorId,
        daliNetworkId: req.daliNetworkId,
        assignedAt: nowIso(),
      });
    }
    const dto = await jsonFetch<GatewayAssignmentDto>(
      `/api/v1/gateways/${encodeURIComponent(id)}/assignments`,
      { method: 'POST', body: JSON.stringify(req) }
    );
    return mapAssignmentDto(dto);
  },

  async unassignGateway(id: string, assignmentId: string): Promise<void> {
    if (USE_MOCK) {
      await mockDelay();
      return;
    }
    await jsonFetch<void>(
      `/api/v1/gateways/${encodeURIComponent(id)}/assignments/${encodeURIComponent(assignmentId)}`,
      { method: 'DELETE' }
    );
  },

  /* ---- Integration ---- */

  async getIntegrationState(): Promise<{
    useMock: boolean;
    healthCheckIntervalSeconds: number;
    maxReconnectAttempts: number;
  }> {
    if (USE_MOCK) {
      await mockDelay();
      return { useMock: true, healthCheckIntervalSeconds: 30, maxReconnectAttempts: 5 };
    }
    return jsonFetch('/api/v1/gateway-integration/state');
  },

  async pingGateway(id: string): Promise<boolean> {
    if (USE_MOCK) {
      await mockDelay();
      return true;
    }
    return jsonFetch<boolean>(
      `/api/v1/gateway-integration/${encodeURIComponent(id)}/ping`,
      { method: 'POST' }
    );
  },
};

export type GatewayManagementApiClient = typeof GatewayManagementApi;