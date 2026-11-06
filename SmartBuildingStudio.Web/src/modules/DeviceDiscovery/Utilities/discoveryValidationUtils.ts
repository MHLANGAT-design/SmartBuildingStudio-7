// src/modules/DeviceDiscovery/Utilities/discoveryValidationUtils.ts

/**
 * Precondition helpers for the discovery workflows.
 *
 * Every function either returns void (valid) or throws a clear Error
 * (invalid). Workflows call these at the top of each step so the "what is
 * required to start discovery" rules live in one place and are unit-testable.
 *
 * The messages are user-facing — they're what the error toast shows.
 */

import type { DiscoverySession } from '@/modules/DeviceDiscovery/Models/DiscoverySession';
import { isSessionActive, isSessionStoppable } from '@/modules/DeviceDiscovery/Models/DiscoverySession';
import type { DiscoverySessionScope } from '@/modules/DeviceDiscovery/Models/DiscoverySession';

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

export const assertSessionExists = (
  session: DiscoverySession | null | undefined
): asserts session is DiscoverySession => {
  if (!session?.sessionId) {
    throw new Error('Start a discovery session first.');
  }
};

export const assertNoActiveSession = (
  session: DiscoverySession | null | undefined
): void => {
  if (isSessionActive(session ?? null)) {
    throw new Error('A discovery session is already running.');
  }
};

export const assertSessionRunning = (
  session: DiscoverySession | null | undefined
): void => {
  assertSessionExists(session);
  if (session.status !== 'RUNNING') {
    throw new Error(`Session must be RUNNING (currently ${session.status}).`);
  }
};

export const assertSessionStoppable = (
  session: DiscoverySession | null | undefined
): void => {
  assertSessionExists(session);
  if (!isSessionStoppable(session)) {
    throw new Error(`Cannot stop a session in status ${session.status}.`);
  }
};

/* ------------------------------------------------------------------ */
/* Gateway                                                             */
/* ------------------------------------------------------------------ */

export const assertGatewaySelected = (
  gatewayId: string | null | undefined
): asserts gatewayId is string => {
  if (!gatewayId) {
    throw new Error('Select a gateway before starting discovery.');
  }
};

export const assertGatewayConnected = (
  gateway: { name: string; isConnected: boolean } | null | undefined
): asserts gateway is { name: string; isConnected: boolean } => {
  if (!gateway) {
    throw new Error('No gateway selected.');
  }
  if (!gateway.isConnected) {
    throw new Error(`Gateway "${gateway.name}" is not connected.`);
  }
};

/* ------------------------------------------------------------------ */
/* Scope / design                                                      */
/* ------------------------------------------------------------------ */

export const assertScopeHasLines = (
  scope: DiscoverySessionScope | null | undefined
): void => {
  if (!scope?.daliLineIds?.length) {
    throw new Error('Select at least one DALI line before starting discovery.');
  }
};

export const assertDaliLineSelected = (
  daliLineId: string | null | undefined
): asserts daliLineId is string => {
  if (!daliLineId) {
    throw new Error('Select a DALI line.');
  }
};

export const assertDesignFixturesLoaded = (
  fixtures: unknown[] | null | undefined
): void => {
  if (!fixtures) {
    throw new Error(
      'Design data is not available. Verify the project and DALI design are loaded in ProjectExplorer.'
    );
  }
  if (fixtures.length === 0) {
    throw new Error(
      'No design fixtures found for the selected lines. Load or sync the DALI design before matching.'
    );
  }
};

/* ------------------------------------------------------------------ */
/* Devices                                                             */
/* ------------------------------------------------------------------ */

export const assertDeviceSelected = (
  deviceId: string | null | undefined
): asserts deviceId is string => {
  if (!deviceId) throw new Error('Select a device.');
};

export const assertDevicesDiscovered = (
  count: number
): void => {
  if (count <= 0) {
    throw new Error('No discovered devices. Run discovery first.');
  }
};

/* ------------------------------------------------------------------ */
/* Lightweight validation result                                       */
/* ------------------------------------------------------------------ */

export interface ValidationIssue {
  field: string;
  message: string;
}

/**
 * Non-throwing validation used by the UI (e.g. to disable the Start button
 * and show inline hints). Returns an array of issues; empty means valid.
 */
export const validateStartDiscoveryInput = (input: {
  gatewayId: string | null;
  scope: DiscoverySessionScope | null;
  session: DiscoverySession | null;
}): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (!input.gatewayId) issues.push({ field: 'gatewayId', message: 'Select a gateway.' });
  if (!input.scope?.daliLineIds?.length) {
    issues.push({ field: 'daliLineIds', message: 'Select at least one DALI line.' });
  }
  if (isSessionActive(input.session)) {
    issues.push({ field: 'session', message: 'A session is already running.' });
  }
  return issues;
};