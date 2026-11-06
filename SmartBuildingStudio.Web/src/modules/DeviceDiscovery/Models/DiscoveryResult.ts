// src/modules/DeviceDiscovery/Models/DiscoveryResult.ts

/**
 * Frontend model for the aggregate result of a discovery session.
 *
 * This is what DiscoveryResults/ displays: summary counts, the set of
 * exceptions, and links to the matched/unmatched devices. It is derived from
 * the session + its devices, but is also fetched as a distinct payload so the
 * backend can compute it once.
 */

import type { DiscoveredDeviceStatus } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';

export type DiscoveryExceptionKind =
  | 'UNIDENTIFIED'
  | 'UNMATCHED'
  | 'ADDRESS_CONFLICT'
  | 'MISSING_FROM_DESIGN'
  | 'UNEXPECTED_DEVICE'
  | 'COMMUNICATION_ERROR';

export interface DiscoveryException {
  exceptionId: string;
  kind: DiscoveryExceptionKind;
  /** Device this exception is about, if any. */
  deviceId: string | null;
  /** ProjectExplorer FixtureId this exception is about, if any. */
  fixtureId: string | null;
  /** Human-readable description from the engine. */
  message: string;
  /** ISO-8601. */
  recordedAt: string;
}

export interface DiscoveryResultCounts {
  totalDiscovered: number;
  identified: number;
  matched: number;
  exceptions: number;
  /** Breakdown of discovered devices by status — for the summary card. */
  byStatus: Record<DiscoveredDeviceStatus, number>;
}

export interface DiscoveryResult {
  sessionId: string;
  counts: DiscoveryResultCounts;
  exceptions: DiscoveryException[];
  /** ISO-8601. */
  computedAt: string;
}

export const EMPTY_RESULT_COUNTS: DiscoveryResultCounts = {
  totalDiscovered: 0,
  identified: 0,
  matched: 0,
  exceptions: 0,
  byStatus: {
    UNKNOWN: 0,
    IDENTIFIED: 0,
    MATCHED: 0,
    EXCEPTION: 0,
  },
};

export const createEmptyDiscoveryResult = (sessionId: string): DiscoveryResult => ({
  sessionId,
  counts: EMPTY_RESULT_COUNTS,
  exceptions: [],
  computedAt: new Date().toISOString(),
});