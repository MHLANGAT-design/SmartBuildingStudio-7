// src/modules/DeviceDiscovery/Models/DeviceMatch.ts

/**
 * Frontend model for a match between a discovered device and a ProjectExplorer
 * fixture (the intended design).
 *
 * DeviceDiscovery *records* the match; it does not mutate ProjectExplorer.
 * Discrepancies are surfaced as part of the match so the DeviceMatching/
 * discrepancy panel can render them without re-deriving.
 */

export type MatchStatus =
  | 'MATCHED'
  | 'UNMATCHED'
  | 'AMBIGUOUS'
  | 'CONFLICT';

export type DiscrepancyKind =
  | 'TYPE_MISMATCH'
  | 'LOCATION_MISMATCH'
  | 'ADDRESS_MISMATCH'
  | 'CAPABILITY_MISMATCH'
  | 'DUPLICATE_ADDRESS'
  | 'MISSING_DEVICE';

export interface DeviceMatchDiscrepancy {
  kind: DiscrepancyKind;
  /** Human-readable description of what differs. */
  message: string;
  /** Free-form expected/actual values for display. */
  expected?: string | null;
  actual?: string | null;
}

export interface DeviceMatch {
  matchId: string;
  sessionId: string;
  /** The discovered device. */
  deviceId: string;
  /** The ProjectExplorer fixture it was compared against (null if unmatched). */
  fixtureId: string | null;
  status: MatchStatus;
  /** 0–1 confidence of the match. Null when unmatched. */
  confidence: number | null;
  /** Differences between discovered device and design fixture. */
  discrepancies: DeviceMatchDiscrepancy[];
  /** ISO-8601. */
  matchedAt: string;
}

export const createEmptyDeviceMatch = (
  partial: Partial<DeviceMatch> & { matchId: string; sessionId: string; deviceId: string }
): DeviceMatch => ({
  matchId: partial.matchId,
  sessionId: partial.sessionId,
  deviceId: partial.deviceId,
  fixtureId: partial.fixtureId ?? null,
  status: partial.status ?? 'UNMATCHED',
  confidence: partial.confidence ?? null,
  discrepancies: partial.discrepancies ?? [],
  matchedAt: partial.matchedAt ?? new Date().toISOString(),
});

export const hasDiscrepancies = (m: DeviceMatch): boolean =>
  m.discrepancies.length > 0;

export const isFullyMatched = (m: DeviceMatch): boolean =>
  m.status === 'MATCHED' && m.discrepancies.length === 0;