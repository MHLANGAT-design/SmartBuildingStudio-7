// src/modules/DeviceDiscovery/Models/DiscoverySession.ts

/**
 * Frontend model for a discovery session.
 *
 * Owned by DeviceDiscovery. References (does not own) ProjectExplorer identifiers
 * and the GatewayManagement gatewayId. Never mutates engineering design.
 */

export type DiscoverySessionStatus =
  | 'CREATED'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type DiscoveryPhase =
  | 'IDLE'
  | 'STARTING'
  | 'DISCOVERING'
  | 'IDENTIFYING'
  | 'MATCHING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface DiscoverySessionScope {
  /** ProjectExplorer identifiers — stored as opaque IDs, never foreign keys. */
  projectId: string | null;
  buildingId: string | null;
  floorId: string | null;
  drawingDocumentId: string | null;
  /** DALI line identifiers from ProjectExplorer's DALI design. */
  daliLineIds: string[];
}

export interface DiscoverySessionProgress {
  /** 0–100. */
  percent: number;
  /** Devices found so far in the current session. */
  discoveredCount: number;
  /** Devices successfully identified so far. */
  identifiedCount: number;
  /** Devices matched to design so far. */
  matchedCount: number;
  /** Exceptions recorded so far. */
  exceptionCount: number;
}

export interface DiscoverySession {
  sessionId: string;
  /** GatewayManagement gatewayId — this module calls GatewayManagement, never the gateway. */
  gatewayId: string;
  scope: DiscoverySessionScope;
  status: DiscoverySessionStatus;
  phase: DiscoveryPhase;
  progress: DiscoverySessionProgress;
  /** Optional human-readable status message from the engine/workflow. */
  statusMessage: string | null;
  /** Last error message, if status === 'FAILED'. */
  errorMessage: string | null;
  /** ISO-8601 timestamps. */
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  /** Who initiated the session (operator name / user id), if provided. */
  initiatedBy: string | null;
}

/** Defaults used when mapping an incomplete/unknown backend DTO. */
export const EMPTY_SESSION_PROGRESS: DiscoverySessionProgress = {
  percent: 0,
  discoveredCount: 0,
  identifiedCount: 0,
  matchedCount: 0,
  exceptionCount: 0,
};

export const EMPTY_SESSION_SCOPE: DiscoverySessionScope = {
  projectId: null,
  buildingId: null,
  floorId: null,
  drawingDocumentId: null,
  daliLineIds: [],
};

/** True when the session is in a state that accepts a "Stop" action. */
export const isSessionStoppable = (s: DiscoverySession | null): boolean =>
  !!s && (s.status === 'RUNNING' || s.status === 'STARTING');

/** True when the session is in a state that accepts a "Start" action. */
export const isSessionStartable = (s: DiscoverySession | null): boolean =>
  !!s && (s.status === 'CREATED' || s.status === 'COMPLETED' || s.status === 'FAILED' || s.status === 'CANCELLED');

/** True when the session is still in flight. */
export const isSessionActive = (s: DiscoverySession | null): boolean =>
  !!s && (s.status === 'STARTING' || s.status === 'RUNNING' || s.status === 'STOPPING');