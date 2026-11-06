// src/modules/DeviceDiscovery/Services/DeviceDiscoveryApi.ts

/**
 * Fetch layer for DeviceDiscovery.
 *
 * Every method:
 *  - returns a frontend Model (never a raw DTO),
 *  - maps incomplete backend payloads with defaults so a backend regression
 *    cannot crash a dialog,
 *  - delegates mock behavior to the module services when USE_MOCK is true.
 *
 * The Store/thunks layer calls this; components never call this directly.
 */

import { USE_MOCK, mockDelay, nowIso, jsonFetch } from '@/modules/DeviceDiscovery/Services/apiConfig';
import type {
  DiscoverySession,
  DiscoverySessionStatus,
  DiscoveryPhase,
  DiscoverySessionScope,
  DiscoverySessionProgress,
} from '@/modules/DeviceDiscovery/Models/DiscoverySession';
import {
  EMPTY_SESSION_SCOPE,
  EMPTY_SESSION_PROGRESS,
} from '@/modules/DeviceDiscovery/Models/DiscoverySession';
import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';
import { createEmptyDiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';
import type { DeviceIdentification } from '@/modules/DeviceDiscovery/Models/DeviceIdentification';
import { createEmptyIdentification } from '@/modules/DeviceDiscovery/Models/DeviceIdentification';
import type { DiscoveryResult, DiscoveryException } from '@/modules/DeviceDiscovery/Models/DiscoveryResult';
import { EMPTY_RESULT_COUNTS } from '@/modules/DeviceDiscovery/Models/DiscoveryResult';
import type { DeviceMatch } from '@/modules/DeviceDiscovery/Models/DeviceMatch';
import { createEmptyDeviceMatch } from '@/modules/DeviceDiscovery/Models/DeviceMatch';

/* ------------------------------------------------------------------ */
/* Request payloads                                                    */
/* ------------------------------------------------------------------ */

export interface CreateDiscoverySessionRequest {
  gatewayId: string;
  scope: DiscoverySessionScope;
  initiatedBy?: string | null;
}

export interface StartDiscoveryRequest {
  sessionId: string;
}

export interface StopDiscoveryRequest {
  sessionId: string;
}

export interface CancelDiscoveryRequest {
  sessionId: string;
}

export interface IdentifyDeviceRequest {
  sessionId: string;
  deviceId: string;
}

export interface MatchDiscoveredDevicesRequest {
  sessionId: string;
}

/* ------------------------------------------------------------------ */
/* DTO shapes (what the backend actually returns)                      */
/* ------------------------------------------------------------------ */

interface DiscoverySessionDto {
  sessionId?: string;
  gatewayId?: string;
  scope?: Partial<DiscoverySessionScope>;
  status?: string;
  phase?: string;
  progress?: Partial<DiscoverySessionProgress>;
  statusMessage?: string | null;
  errorMessage?: string | null;
  createdAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  initiatedBy?: string | null;
}

interface DiscoveredDeviceDto {
  deviceId?: string;
  sessionId?: string;
  randomAddress?: string;
  shortAddress?: number | null;
  daliLineId?: string | null;
  deviceType?: string | null;
  manufacturer?: string | null;
  firmwareVersion?: string | null;
  status?: string;
  isOnline?: boolean;
  capabilities?: string[];
  matchedFixtureId?: string | null;
  matchConfidence?: number | null;
  discoveredAt?: string;
  lastSeenAt?: string | null;
}

interface DeviceIdentificationDto {
  identificationId?: string;
  deviceId?: string;
  sessionId?: string;
  status?: string;
  manufacturer?: string | null;
  firmwareVersion?: string | null;
  deviceType?: string | null;
  capabilities?: string[];
  serialNumber?: string | null;
  gtin?: string | null;
  errorMessage?: string | null;
  requestedAt?: string;
  completedAt?: string | null;
}

interface DiscoveryResultDto {
  sessionId?: string;
  counts?: Partial<typeof EMPTY_RESULT_COUNTS>;
  exceptions?: Array<Partial<DiscoveryException>>;
  computedAt?: string;
}

interface DeviceMatchDto {
  matchId?: string;
  sessionId?: string;
  deviceId?: string;
  fixtureId?: string | null;
  status?: string;
  confidence?: number | null;
  discrepancies?: Array<{
    kind?: string;
    message?: string;
    expected?: string | null;
    actual?: string | null;
  }>;
  matchedAt?: string;
}

/* ------------------------------------------------------------------ */
/* DTO → Model mappers                                                 */
/* ------------------------------------------------------------------ */

const SESSION_STATUSES: DiscoverySessionStatus[] = [
  'CREATED', 'STARTING', 'RUNNING', 'STOPPING', 'COMPLETED', 'FAILED', 'CANCELLED',
];
const SESSION_PHASES: DiscoveryPhase[] = [
  'IDLE', 'STARTING', 'DISCOVERING', 'IDENTIFYING', 'MATCHING', 'COMPLETED', 'FAILED', 'CANCELLED',
];

const asStatus = (v: string | undefined): DiscoverySessionStatus =>
  SESSION_STATUSES.includes(v as DiscoverySessionStatus)
    ? (v as DiscoverySessionStatus)
    : 'CREATED';

const asPhase = (v: string | undefined): DiscoveryPhase =>
  SESSION_PHASES.includes(v as DiscoveryPhase)
    ? (v as DiscoveryPhase)
    : 'IDLE';

export const mapSessionDto = (dto: DiscoverySessionDto | null | undefined): DiscoverySession => {
  const d = dto ?? {};
  return {
    sessionId: d.sessionId ?? '',
    gatewayId: d.gatewayId ?? '',
    scope: {
      projectId: d.scope?.projectId ?? EMPTY_SESSION_SCOPE.projectId,
      buildingId: d.scope?.buildingId ?? EMPTY_SESSION_SCOPE.buildingId,
      floorId: d.scope?.floorId ?? EMPTY_SESSION_SCOPE.floorId,
      drawingDocumentId: d.scope?.drawingDocumentId ?? EMPTY_SESSION_SCOPE.drawingDocumentId,
      daliLineIds: d.scope?.daliLineIds ?? [],
    },
    status: asStatus(d.status),
    phase: asPhase(d.phase),
    progress: {
      percent: d.progress?.percent ?? EMPTY_SESSION_PROGRESS.percent,
      discoveredCount: d.progress?.discoveredCount ?? EMPTY_SESSION_PROGRESS.discoveredCount,
      identifiedCount: d.progress?.identifiedCount ?? EMPTY_SESSION_PROGRESS.identifiedCount,
      matchedCount: d.progress?.matchedCount ?? EMPTY_SESSION_PROGRESS.matchedCount,
      exceptionCount: d.progress?.exceptionCount ?? EMPTY_SESSION_PROGRESS.exceptionCount,
    },
    statusMessage: d.statusMessage ?? null,
    errorMessage: d.errorMessage ?? null,
    createdAt: d.createdAt ?? nowIso(),
    startedAt: d.startedAt ?? null,
    completedAt: d.completedAt ?? null,
    initiatedBy: d.initiatedBy ?? null,
  };
};

export const mapDeviceDto = (dto: DiscoveredDeviceDto | null | undefined): DiscoveredDevice => {
  const d = dto ?? {};
  return createEmptyDiscoveredDevice({
    deviceId: d.deviceId ?? '',
    sessionId: d.sessionId ?? '',
    randomAddress: d.randomAddress ?? '',
    shortAddress: d.shortAddress ?? null,
    daliLineId: d.daliLineId ?? null,
    deviceType: d.deviceType ?? null,
    manufacturer: d.manufacturer ?? null,
    firmwareVersion: d.firmwareVersion ?? null,
    status: (['UNKNOWN', 'IDENTIFIED', 'MATCHED', 'EXCEPTION'] as const).includes(
      d.status as any
    )
      ? (d.status as DiscoveredDevice['status'])
      : 'UNKNOWN',
    isOnline: d.isOnline ?? false,
    capabilities: d.capabilities ?? [],
    matchedFixtureId: d.matchedFixtureId ?? null,
    matchConfidence: d.matchConfidence ?? null,
    discoveredAt: d.discoveredAt ?? nowIso(),
    lastSeenAt: d.lastSeenAt ?? null,
  });
};

export const mapIdentificationDto = (
  dto: DeviceIdentificationDto | null | undefined
): DeviceIdentification => {
  const d = dto ?? {};
  return createEmptyIdentification({
    identificationId: d.identificationId ?? '',
    deviceId: d.deviceId ?? '',
    sessionId: d.sessionId ?? '',
    status: (['PENDING', 'SUCCEEDED', 'FAILED', 'PARTIAL'] as const).includes(
      d.status as any
    )
      ? (d.status as DeviceIdentification['status'])
      : 'PENDING',
    manufacturer: d.manufacturer ?? null,
    firmwareVersion: d.firmwareVersion ?? null,
    deviceType: d.deviceType ?? null,
    capabilities: d.capabilities ?? [],
    serialNumber: d.serialNumber ?? null,
    gtin: d.gtin ?? null,
    errorMessage: d.errorMessage ?? null,
    requestedAt: d.requestedAt ?? nowIso(),
    completedAt: d.completedAt ?? null,
  });
};

export const mapResultDto = (dto: DiscoveryResultDto | null | undefined): DiscoveryResult => {
  const d = dto ?? {};
  return {
    sessionId: d.sessionId ?? '',
    counts: {
      ...EMPTY_RESULT_COUNTS,
      ...d.counts,
      byStatus: {
        ...EMPTY_RESULT_COUNTS.byStatus,
        ...(d.counts?.byStatus ?? {}),
      },
    },
    exceptions: (d.exceptions ?? []).map(e => ({
      exceptionId: e.exceptionId ?? '',
      kind: (e.kind as DiscoveryException['kind']) ?? 'UNIDENTIFIED',
      deviceId: e.deviceId ?? null,
      fixtureId: e.fixtureId ?? null,
      message: e.message ?? '',
      recordedAt: e.recordedAt ?? nowIso(),
    })),
    computedAt: d.computedAt ?? nowIso(),
  };
};

export const mapMatchDto = (dto: DeviceMatchDto | null | undefined): DeviceMatch => {
  const d = dto ?? {};
  return createEmptyDeviceMatch({
    matchId: d.matchId ?? '',
    sessionId: d.sessionId ?? '',
    deviceId: d.deviceId ?? '',
    fixtureId: d.fixtureId ?? null,
    status: (['MATCHED', 'UNMATCHED', 'AMBIGUOUS', 'CONFLICT'] as const).includes(
      d.status as any
    )
      ? (d.status as DeviceMatch['status'])
      : 'UNMATCHED',
    confidence: d.confidence ?? null,
    discrepancies: (d.discrepancies ?? []).map(x => ({
      kind: (x.kind as any) ?? 'TYPE_MISMATCH',
      message: x.message ?? '',
      expected: x.expected ?? null,
      actual: x.actual ?? null,
    })),
    matchedAt: d.matchedAt ?? nowIso(),
  });
};

/* ------------------------------------------------------------------ */
/* API client                                                          */
/* ------------------------------------------------------------------ */

export const DeviceDiscoveryApi = {
  /* ---- Sessions ---- */
  async createSession(req: CreateDiscoverySessionRequest): Promise<DiscoverySession> {
    if (USE_MOCK) {
      await mockDelay();
      return mapSessionDto({
        sessionId: `sess-${Date.now()}`,
        gatewayId: req.gatewayId,
        scope: req.scope,
        status: 'CREATED',
        phase: 'IDLE',
        progress: EMPTY_SESSION_PROGRESS,
        statusMessage: null,
        errorMessage: null,
        createdAt: nowIso(),
        startedAt: null,
        completedAt: null,
        initiatedBy: req.initiatedBy ?? null,
      });
    }
    const dto = await jsonFetch<DiscoverySessionDto>('/discovery-sessions', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    return mapSessionDto(dto);
  },

  async startDiscovery(req: StartDiscoveryRequest): Promise<DiscoverySession> {
    if (USE_MOCK) {
      await mockDelay();
      return mapSessionDto({
        sessionId: req.sessionId,
        status: 'RUNNING',
        phase: 'DISCOVERING',
        progress: { percent: 5, discoveredCount: 0, identifiedCount: 0, matchedCount: 0, exceptionCount: 0 },
        startedAt: nowIso(),
      });
    }
    const dto = await jsonFetch<DiscoverySessionDto>(
      `/discovery-sessions/${encodeURIComponent(req.sessionId)}/start`,
      { method: 'POST' }
    );
    return mapSessionDto(dto);
  },

  async stopDiscovery(req: StopDiscoveryRequest): Promise<DiscoverySession> {
    if (USE_MOCK) {
      await mockDelay();
      return mapSessionDto({
        sessionId: req.sessionId,
        status: 'STOPPING',
        phase: 'DISCOVERING',
      });
    }
    const dto = await jsonFetch<DiscoverySessionDto>(
      `/discovery-sessions/${encodeURIComponent(req.sessionId)}/stop`,
      { method: 'POST' }
    );
    return mapSessionDto(dto);
  },

  async cancelDiscovery(req: CancelDiscoveryRequest): Promise<DiscoverySession> {
    if (USE_MOCK) {
      await mockDelay();
      return mapSessionDto({
        sessionId: req.sessionId,
        status: 'CANCELLED',
        phase: 'CANCELLED',
        completedAt: nowIso(),
      });
    }
    const dto = await jsonFetch<DiscoverySessionDto>(
      `/discovery-sessions/${encodeURIComponent(req.sessionId)}/cancel`,
      { method: 'POST' }
    );
    return mapSessionDto(dto);
  },

  async getSession(sessionId: string): Promise<DiscoverySession> {
    if (USE_MOCK) {
      await mockDelay();
      return mapSessionDto({ sessionId, status: 'RUNNING', phase: 'DISCOVERING' });
    }
    const dto = await jsonFetch<DiscoverySessionDto>(
      `/discovery-sessions/${encodeURIComponent(sessionId)}`
    );
    return mapSessionDto(dto);
  },

  async getSessions(): Promise<DiscoverySession[]> {
    if (USE_MOCK) {
      await mockDelay();
      return [];
    }
    const dtos = await jsonFetch<DiscoverySessionDto[]>('/discovery-sessions');
    return (dtos ?? []).map(mapSessionDto);
  },

  /* ---- Discovered devices ---- */
  async getDiscoveredDevices(sessionId: string): Promise<DiscoveredDevice[]> {
    if (USE_MOCK) {
      await mockDelay();
      return [];
    }
    const dtos = await jsonFetch<DiscoveredDeviceDto[]>(
      `/discovery-sessions/${encodeURIComponent(sessionId)}/devices`
    );
    return (dtos ?? []).map(mapDeviceDto);
  },

  /* ---- Identification ---- */
  async identifyDevice(req: IdentifyDeviceRequest): Promise<DeviceIdentification> {
    if (USE_MOCK) {
      await mockDelay();
      return mapIdentificationDto({
        identificationId: `id-${req.deviceId}-${Date.now()}`,
        deviceId: req.deviceId,
        sessionId: req.sessionId,
        status: 'SUCCEEDED',
        requestedAt: nowIso(),
        completedAt: nowIso(),
      });
    }
    const dto = await jsonFetch<DeviceIdentificationDto>(
      `/devices/${encodeURIComponent(req.deviceId)}/identify`,
      { method: 'POST', body: JSON.stringify({ sessionId: req.sessionId }) }
    );
    return mapIdentificationDto(dto);
  },

  /* ---- Matching ---- */
  async matchDiscoveredDevices(req: MatchDiscoveredDevicesRequest): Promise<DeviceMatch[]> {
    if (USE_MOCK) {
      await mockDelay();
      return [];
    }
    const dtos = await jsonFetch<DeviceMatchDto[]>(
      `/discovery-sessions/${encodeURIComponent(req.sessionId)}/match`,
      { method: 'POST' }
    );
    return (dtos ?? []).map(mapMatchDto);
  },

  async getMatches(sessionId: string): Promise<DeviceMatch[]> {
    if (USE_MOCK) {
      await mockDelay();
      return [];
    }
    const dtos = await jsonFetch<DeviceMatchDto[]>(
      `/discovery-sessions/${encodeURIComponent(sessionId)}/matches`
    );
    return (dtos ?? []).map(mapMatchDto);
  },

  /* ---- Results ---- */
  async getResults(sessionId: string): Promise<DiscoveryResult> {
    if (USE_MOCK) {
      await mockDelay();
      return mapResultDto({ sessionId, computedAt: nowIso() });
    }
    const dto = await jsonFetch<DiscoveryResultDto>(
      `/discovery-sessions/${encodeURIComponent(sessionId)}/results`
    );
    return mapResultDto(dto);
  },

  /* ---- History ---- */
  async getHistory(): Promise<DiscoverySession[]> {
    if (USE_MOCK) {
      await mockDelay();
      return [];
    }
    const dtos = await jsonFetch<DiscoverySessionDto[]>('/discovery-history');
    return (dtos ?? []).map(mapSessionDto);
  },

  async getHistoryEntry(sessionId: string): Promise<DiscoverySession> {
    if (USE_MOCK) {
      await mockDelay();
      return mapSessionDto({ sessionId, status: 'COMPLETED', phase: 'COMPLETED' });
    }
    const dto = await jsonFetch<DiscoverySessionDto>(
      `/discovery-history/${encodeURIComponent(sessionId)}`
    );
    return mapSessionDto(dto);
  },
};

export type DeviceDiscoveryApiClient = typeof DeviceDiscoveryApi;