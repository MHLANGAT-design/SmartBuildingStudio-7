// src/modules/DeviceDiscovery/Utilities/deviceMatchingUtils.ts

/**
 * Matching / hashing / PRNG utilities.
 *
 * Extracted from DeviceDiscoveryEngine and DeviceMatchingEngine so that:
 *  - the PRNG has one home (no copy-paste drift),
 *  - match-confidence scoring is testable in isolation,
 *  - discrepancy grouping is reusable by the discrepancy panel.
 */

import type {
  DeviceMatch,
  DeviceMatchDiscrepancy,
  DiscrepancyKind,
} from '@/modules/DeviceDiscovery/Models/DeviceMatch';

/* ------------------------------------------------------------------ */
/* Deterministic PRNG (Mulberry32)                                     */
/* ------------------------------------------------------------------ */

/** Stable 32-bit FNV-1a hash of a string. Deterministic across runs. */
export const hashSeed = (input: string): number => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
};

/** Mulberry32 — tiny, fast, deterministic. Returns [0, 1). */
export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Convenience: seed a PRNG from a string (e.g. a session+gateway pair). */
export const seededRandom = (seedInput: string): (() => number) =>
  mulberry32(hashSeed(seedInput));

/* ------------------------------------------------------------------ */
/* Match confidence / status scoring                                   */
/* ------------------------------------------------------------------ */

/**
 * Score a match's confidence from the number and kind of discrepancies.
 *
 * Kept separate from DeviceMatchingEngine so it can be unit-tested and so a
 * future real matcher can call it with the same rules.
 *
 *  - 0 discrepancies          → 1.00 (perfect match)
 *  - only ADDRESS_MISMATCH    → 0.75 (likely still the same device)
 *  - only CAPABILITY_MISMATCH → 0.60
 *  - any critical discrepancy → 0.40
 *  - otherwise                → 0.50
 */
export const scoreMatchConfidence = (
  discrepancies: DeviceMatchDiscrepancy[]
): number => {
  if (discrepancies.length === 0) return 1;
  const kinds = new Set(discrepancies.map(d => d.kind));
  if (kinds.size === 1 && kinds.has('ADDRESS_MISMATCH')) return 0.75;
  if (kinds.size === 1 && kinds.has('CAPABILITY_MISMATCH')) return 0.6;
  if (CRITICAL_DISCREPANCIES.some(k => kinds.has(k))) return 0.4;
  return 0.5;
};

/** Discrepancy kinds that block commissioning (per frozen architecture). */
export const CRITICAL_DISCREPANCIES: DiscrepancyKind[] = [
  'TYPE_MISMATCH',
  'LOCATION_MISMATCH',
  'MISSING_DEVICE',
  'DUPLICATE_ADDRESS',
];

export const isCriticalDiscrepancy = (kind: DiscrepancyKind): boolean =>
  CRITICAL_DISCREPANCIES.includes(kind);

/** True if a match has any critical discrepancy. */
export const hasCriticalDiscrepancy = (m: DeviceMatch): boolean =>
  m.discrepancies.some(d => isCriticalDiscrepancy(d.kind));

/** True if a match is fully matched (status MATCHED and no discrepancies). */
export const isFullyMatched = (m: DeviceMatch): boolean =>
  m.status === 'MATCHED' && m.discrepancies.length === 0;

/* ------------------------------------------------------------------ */
/* Grouping                                                            */
/* ------------------------------------------------------------------ */

/** Group discrepancies by kind, in the order the kinds appear. */
export const groupDiscrepanciesByKind = (
  discrepancies: DeviceMatchDiscrepancy[]
): Record<DiscrepancyKind, DeviceMatchDiscrepancy[]> => {
  const out = {} as Record<DiscrepancyKind, DeviceMatchDiscrepancy[]>;
  for (const d of discrepancies) {
    (out[d.kind] ??= []).push(d);
  }
  return out;
};

/** Group matches by status. */
export const groupMatchesByStatus = (
  matches: DeviceMatch[]
): Record<DeviceMatch['status'], DeviceMatch[]> => ({
  MATCHED: matches.filter(m => m.status === 'MATCHED'),
  UNMATCHED: matches.filter(m => m.status === 'UNMATCHED'),
  AMBIGUOUS: matches.filter(m => m.status === 'AMBIGUOUS'),
  CONFLICT: matches.filter(m => m.status === 'CONFLICT'),
});

/** Deduplicate discrepancies by `kind + message` for display. */
export const dedupeDiscrepancies = (
  discrepancies: DeviceMatchDiscrepancy[]
): DeviceMatchDiscrepancy[] => {
  const seen = new Set<string>();
  const out: DeviceMatchDiscrepancy[] = [];
  for (const d of discrepancies) {
    const key = `${d.kind}|${d.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d);
  }
  return out;
};