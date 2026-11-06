// src/modules/DeviceDiscovery/Utilities/discoveryResultUtils.ts

/**
 * Derived helpers for the results / history / summary panels.
 *
 * All pure functions over DiscoveryResult / DeviceMatch / DiscoveryException.
 * No imports from Store/, Services/, or Workflows/ — only Models/ and the
 * deviceAddressUtils module for label formatting.
 */

import type {
  DiscoveryException,
  DiscoveryExceptionKind,
  DiscoveryResult,
  DiscoveryResultCounts,
} from '@/modules/DeviceDiscovery/Models/DiscoveryResult';
import { EMPTY_RESULT_COUNTS } from '@/modules/DeviceDiscovery/Models/DiscoveryResult';
import type { DeviceMatch } from '@/modules/DeviceDiscovery/Models/DeviceMatch';
import type { DiscoverySession } from '@/modules/DeviceDiscovery/Models/DiscoverySession';

/* ------------------------------------------------------------------ */
/* Counts                                                              */
/* ------------------------------------------------------------------ */

export const isEmptyResult = (r: DiscoveryResult | null | undefined): boolean =>
  !r || r.counts.totalDiscovered === 0;

/** Human summary line for the DiscoveryResults summary card. */
export const summarizeResult = (r: DiscoveryResult | null | undefined): string => {
  if (isEmptyResult(r)) return 'No devices discovered.';
  const { totalDiscovered, identified, matched, exceptions } = r!.counts;
  return `${totalDiscovered} discovered · ${identified} identified · ${matched} matched · ${exceptions} exception${
    exceptions === 1 ? '' : 's'
  }`;
};

/** Ratio helpers for the summary bar (0–1). */
export const matchRate = (counts: DiscoveryResultCounts): number =>
  counts.totalDiscovered === 0 ? 0 : counts.matched / counts.totalDiscovered;

export const exceptionRate = (counts: DiscoveryResultCounts): number =>
  counts.totalDiscovered === 0 ? 0 : counts.exceptions / counts.totalDiscovered;

/* ------------------------------------------------------------------ */
/* Exceptions                                                          */
/* ------------------------------------------------------------------ */

export const EXCEPTION_LABELS: Record<DiscoveryExceptionKind, string> = {
  UNIDENTIFIED: 'Unidentified',
  UNMATCHED: 'Unmatched',
  ADDRESS_CONFLICT: 'Address conflict',
  MISSING_FROM_DESIGN: 'Missing from design',
  UNEXPECTED_DEVICE: 'Unexpected device',
  COMMUNICATION_ERROR: 'Communication error',
};

export const exceptionLabel = (kind: DiscoveryExceptionKind): string =>
  EXCEPTION_LABELS[kind] ?? kind;

/**
 * Severity of an exception — used to sort the exceptions panel.
 * "critical" exceptions block commissioning; "warning" ones don't.
 */
export type ExceptionSeverity = 'critical' | 'warning';

const SEVERITY: Record<DiscoveryExceptionKind, ExceptionSeverity> = {
  UNIDENTIFIED: 'warning',
  UNMATCHED: 'warning',
  ADDRESS_CONFLICT: 'critical',
  MISSING_FROM_DESIGN: 'critical',
  UNEXPECTED_DEVICE: 'critical',
  COMMUNICATION_ERROR: 'critical',
};

export const exceptionSeverity = (kind: DiscoveryExceptionKind): ExceptionSeverity =>
  SEVERITY[kind] ?? 'warning';

export const groupExceptionsByKind = (
  exceptions: DiscoveryException[]
): Record<DiscoveryExceptionKind, DiscoveryException[]> => {
  const out = {} as Record<DiscoveryExceptionKind, DiscoveryException[]>;
  for (const e of exceptions) {
    (out[e.kind] ??= []).push(e);
  }
  return out;
};

export const sortExceptionsBySeverity = (
  exceptions: DiscoveryException[]
): DiscoveryException[] => {
  const rank = (s: ExceptionSeverity) => (s === 'critical' ? 0 : 1);
  return [...exceptions].sort((a, b) => {
    const r = rank(exceptionSeverity(a.kind)) - rank(exceptionSeverity(b.kind));
    if (r !== 0) return r;
    return a.recordedAt.localeCompare(b.recordedAt);
  });
};

/* ------------------------------------------------------------------ */
/* Match summary                                                       */
/* ------------------------------------------------------------------ */

export interface MatchSummary {
  matched: number;
  conflicts: number;
  ambiguous: number;
  unmatched: number;
  total: number;
}

export const summarizeMatches = (matches: DeviceMatch[]): MatchSummary => ({
  matched: matches.filter(m => m.status === 'MATCHED').length,
  conflicts: matches.filter(m => m.status === 'CONFLICT').length,
  ambiguous: matches.filter(m => m.status === 'AMBIGUOUS').length,
  unmatched: matches.filter(m => m.status === 'UNMATCHED').length,
  total: matches.length,
});

/* ------------------------------------------------------------------ */
/* History                                                             */
/* ------------------------------------------------------------------ */

const sessionLabel = (s: DiscoverySession): string =>
  `${s.status} · ${new Date(s.createdAt).toLocaleString()}`;

export const summarizeSession = (s: DiscoverySession): {
  title: string;
  subtitle: string;
  isSuccessful: boolean;
} => ({
  title: s.gatewayId || 'Unknown gateway',
  subtitle: sessionLabel(s),
  isSuccessful: s.status === 'COMPLETED',
});

/** Sort history newest-first. */
export const sortSessionsNewestFirst = (
  sessions: DiscoverySession[]
): DiscoverySession[] =>
  [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

/* ------------------------------------------------------------------ */
/* CSV export (used by the results panel's "Export" action)            */
/* ------------------------------------------------------------------ */

const csvEscape = (value: string | number | null | undefined): string => {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const resultToCsv = (
  result: DiscoveryResult,
  matches: DeviceMatch[]
): string => {
  const lines: string[] = [];
  lines.push('Kind,DeviceId,FixtureId,Message,RecordedAt');
  for (const e of result.exceptions) {
    lines.push(
      [
        csvEscape(exceptionLabel(e.kind)),
        csvEscape(e.deviceId),
        csvEscape(e.fixtureId),
        csvEscape(e.message),
        csvEscape(e.recordedAt),
      ].join(',')
    );
  }
  for (const m of matches) {
    for (const d of m.discrepancies) {
      lines.push(
        [
          csvEscape(d.kind),
          csvEscape(m.deviceId),
          csvEscape(m.fixtureId),
          csvEscape(d.message),
          csvEscape(m.matchedAt),
        ].join(',')
      );
    }
  }
  return lines.join('\n');
};

/** Fallback counts object for components that need a safe default. */
export const safeCounts = (
  r: DiscoveryResult | null | undefined
): DiscoveryResultCounts => r?.counts ?? EMPTY_RESULT_COUNTS;