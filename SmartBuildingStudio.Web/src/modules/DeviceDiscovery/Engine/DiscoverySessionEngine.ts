// src/modules/DeviceDiscovery/Engine/DiscoverySessionEngine.ts

/**
 * DiscoverySessionEngine
 *
 * Pure session state-machine helpers. No state, no timers, no side effects —
 * just functions that take a session and return a new session.
 *
 * Kept deliberately small: the Store slice holds session state, and thunks
 * call these helpers to produce the next session object before dispatching
 * setSession(). This keeps transition rules in ONE place (here) and lets the
 * UI reason about isSessionStoppable/Startable consistently.
 */

import type {
  DiscoverySession,
  DiscoverySessionStatus,
  DiscoveryPhase,
  DiscoverySessionProgress,
} from '@/modules/DeviceDiscovery/Models/DiscoverySession';
import {
  EMPTY_SESSION_PROGRESS,
  EMPTY_SESSION_SCOPE,
} from '@/modules/DeviceDiscovery/Models/DiscoverySession';

const nowIso = (now?: () => string) =>
  (now ?? (() => new Date().toISOString()))();

/** Statuses from which createSession may produce a new live session. */
export const CREATABLE: DiscoverySessionStatus[] = [
  'CREATED', 'COMPLETED', 'FAILED', 'CANCELLED',
];

/** The legal transitions for the session state machine. */
export const TRANSITIONS: Record<DiscoverySessionStatus, DiscoverySessionStatus[]> = {
  CREATED:   ['STARTING', 'CANCELLED'],
  STARTING:  ['RUNNING', 'FAILED', 'CANCELLED'],
  RUNNING:   ['STOPPING', 'COMPLETED', 'FAILED'],
  STOPPING:  ['COMPLETED', 'CANCELLED', 'FAILED'],
  COMPLETED: [],
  FAILED:    [],
  CANCELLED: [],
};

export const canTransition = (
  from: DiscoverySessionStatus,
  to: DiscoverySessionStatus
): boolean => TRANSITIONS[from]?.includes(to) ?? false;

/* ------------------------------------------------------------------ */
/* Factories                                                          */
/* ------------------------------------------------------------------ */

export interface CreateSessionInput {
  sessionId: string;
  gatewayId: string;
  scope: DiscoverySession['scope'];
  initiatedBy?: string | null;
  now?: () => string;
}

export const createSession = (input: CreateSessionInput): DiscoverySession => ({
  sessionId: input.sessionId,
  gatewayId: input.gatewayId,
  scope: {
    projectId: input.scope.projectId ?? EMPTY_SESSION_SCOPE.projectId,
    buildingId: input.scope.buildingId ?? EMPTY_SESSION_SCOPE.buildingId,
    floorId: input.scope.floorId ?? EMPTY_SESSION_SCOPE.floorId,
    drawingDocumentId: input.scope.drawingDocumentId ?? EMPTY_SESSION_SCOPE.drawingDocumentId,
    daliLineIds: input.scope.daliLineIds ?? [],
  },
  status: 'CREATED',
  phase: 'IDLE',
  progress: { ...EMPTY_SESSION_PROGRESS },
  statusMessage: null,
  errorMessage: null,
  createdAt: nowIso(input.now),
  startedAt: null,
  completedAt: null,
  initiatedBy: input.initiatedBy ?? null,
});

/* ------------------------------------------------------------------ */
/* Transitions                                                         */
/* ------------------------------------------------------------------ */

export interface TransitionOptions {
  message?: string | null;
  error?: string | null;
  progress?: Partial<DiscoverySessionProgress>;
  now?: () => string;
}

const assertTransition = (
  from: DiscoverySessionStatus,
  to: DiscoverySessionStatus
): void => {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal session transition ${from} → ${to}.`);
  }
};

export const toStarting = (
  session: DiscoverySession,
  opts: TransitionOptions = {}
): DiscoverySession => {
  assertTransition(session.status, 'STARTING');
  return {
    ...session,
    status: 'STARTING',
    phase: 'STARTING',
    statusMessage: opts.message ?? null,
    errorMessage: null,
    startedAt: session.startedAt ?? nowIso(opts.now),
    progress: { ...session.progress, ...(opts.progress ?? {}) },
  };
};

export const toRunning = (
  session: DiscoverySession,
  opts: TransitionOptions = {}
): DiscoverySession => {
  assertTransition(session.status, 'RUNNING');
  return {
    ...session,
    status: 'RUNNING',
    phase: opts.progress?.percent === 100 ? 'MATCHING' : 'DISCOVERING',
    statusMessage: opts.message ?? null,
    errorMessage: null,
    progress: { ...session.progress, ...(opts.progress ?? {}) },
  };
};

export const toStopping = (
  session: DiscoverySession,
  opts: TransitionOptions = {}
): DiscoverySession => {
  assertTransition(session.status, 'STOPPING');
  return {
    ...session,
    status: 'STOPPING',
    statusMessage: opts.message ?? null,
    progress: { ...session.progress, ...(opts.progress ?? {}) },
  };
};

export const toCompleted = (
  session: DiscoverySession,
  opts: TransitionOptions = {}
): DiscoverySession => {
  assertTransition(session.status, 'COMPLETED');
  const completedAt = nowIso(opts.now);
  return {
    ...session,
    status: 'COMPLETED',
    phase: 'COMPLETED',
    statusMessage: opts.message ?? 'Discovery completed.',
    errorMessage: null,
    completedAt,
    progress: {
      ...session.progress,
      percent: 100,
      ...(opts.progress ?? {}),
    },
  };
};

export const toFailed = (
  session: DiscoverySession,
  opts: TransitionOptions = {}
): DiscoverySession => {
  assertTransition(session.status, 'FAILED');
  return {
    ...session,
    status: 'FAILED',
    phase: 'FAILED',
    errorMessage: opts.error ?? 'Discovery failed.',
    statusMessage: opts.message ?? null,
    completedAt: nowIso(opts.now),
    progress: { ...session.progress, ...(opts.progress ?? {}) },
  };
};

export const toCancelled = (
  session: DiscoverySession,
  opts: TransitionOptions = {}
): DiscoverySession => {
  assertTransition(session.status, 'CANCELLED');
  return {
    ...session,
    status: 'CANCELLED',
    phase: 'CANCELLED',
    statusMessage: opts.message ?? 'Discovery cancelled.',
    completedAt: nowIso(opts.now),
    progress: { ...session.progress, ...(opts.progress ?? {}) },
  };
};

/* ------------------------------------------------------------------ */
/* Progress helpers                                                    */
/* ------------------------------------------------------------------ */

/** Progress step derived from discovered/identified/matched counts. */
export const deriveProgressPercent = (
  discovered: number,
  identified: number,
  matched: number,
  exceptions: number,
  expectedTotal: number
): number => {
  if (expectedTotal <= 0) return 0;
  const done = identified + matched + exceptions;
  const bounded = Math.min(expectedTotal, Math.max(discovered, done));
  return Math.min(100, Math.round((bounded / expectedTotal) * 100));
};

/** Convenience: apply a partial progress object to a session. */
export const withProgress = (
  session: DiscoverySession,
  patch: Partial<DiscoverySessionProgress>
): DiscoverySession => ({
  ...session,
  progress: { ...session.progress, ...patch },
});

/** Phase transition: DISCOVERING → IDENTIFYING → MATCHING → COMPLETED. */
export const nextPhase = (phase: DiscoveryPhase): DiscoveryPhase => {
  switch (phase) {
    case 'IDLE': return 'STARTING';
    case 'STARTING': return 'DISCOVERING';
    case 'DISCOVERING': return 'IDENTIFYING';
    case 'IDENTIFYING': return 'MATCHING';
    case 'MATCHING': return 'COMPLETED';
    case 'COMPLETED':
    case 'FAILED':
    case 'CANCELLED': return phase;
  }
};
/**
 * Grouped export so workflows can call `DiscoverySessionEngine.toRunning(...)`
 * and match the shape of the other four engines (DeviceDiscoveryEngine,
 * DeviceIdentificationEngine, DeviceMatchingEngine, DiscoveryResultEngine).
 */
export const DiscoverySessionEngine = {
  // Predicates & metadata
  CREATABLE,
  TRANSITIONS,
  canTransition,

  // Factories
  createSession,

  // Transitions
  toStarting,
  toRunning,
  toStopping,
  toCompleted,
  toFailed,
  toCancelled,

  // Progress helpers
  deriveProgressPercent,
  withProgress,
  nextPhase,
};