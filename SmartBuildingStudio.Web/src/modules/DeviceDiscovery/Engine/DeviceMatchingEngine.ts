// src/modules/DeviceDiscovery/Engine/DeviceMatchingEngine.ts

/**
 * DeviceMatchingEngine
 *
 * Compares discovered devices against the ProjectExplorer design (read-only).
 * Never mutates the design; produces a DeviceMatch per discovered device.
 *
 * Inputs:
 *  - the list of discovered devices (already identified, ideally),
 *  - the intended design fixtures (pulled from ProjectExplorer by the caller),
 *
 * Matching strategy (deterministic, in order):
 *  1. Exact short-address match on the same line.
 *  2. Device-type + line match (fallback).
 *  3. Unmatched if neither.
 *
 * Discrepancies:
 *  - TYPE_MISMATCH        device type differs from fixture's expected type
 *  - LOCATION_MISMATCH    fixture's line differs from device's line
 *  - ADDRESS_MISMATCH     fixture expects a short address the device doesn't have
 *  - CAPABILITY_MISMATCH  fixture requires a capability the device lacks
 *  - DUPLICATE_ADDRESS    two devices share a short address (reported on both)
 *  - MISSING_DEVICE       fixture has no matching discovered device
 *
 * The engine is pure and returns a stable result for the same inputs.
 */

import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';
import type {
  DeviceMatch,
  DeviceMatchDiscrepancy,
  DiscrepancyKind,
  MatchStatus,
} from '@/modules/DeviceDiscovery/Models/DeviceMatch';
import { createEmptyDeviceMatch } from '@/modules/DeviceDiscovery/Models/DeviceMatch';

/* ------------------------------------------------------------------ */
/* Design fixture shape (ProjectExplorer side, read-only)              */
/* ------------------------------------------------------------------ */

export interface DesignFixture {
  fixtureId: string;
  lineId: string;
  /** Expected DALI short address from the design, if assigned. */
  expectedShortAddress: number | null;
  /** Expected device type, if the design specifies one. */
  expectedDeviceType: string | null;
  /** Capabilities required by the design. */
  requiredCapabilities: string[];
  /** Optional human label for discrepancy messages. */
  label?: string | null;
}

export interface MatchInput {
  sessionId: string;
  devices: DiscoveredDevice[];
  designFixtures: DesignFixture[];
  now?: () => string;
}

/* ------------------------------------------------------------------ */
/* Internal helpers                                                    */
/* ------------------------------------------------------------------ */

const sameType = (a: string | null, b: string | null): boolean =>
  !!a && !!b && a.toUpperCase() === b.toUpperCase();

const countShortAddresses = (
  devices: DiscoveredDevice[]
): Map<number, string[]> => {
  const map = new Map<number, string[]>();
  for (const d of devices) {
    if (d.shortAddress == null) continue;
    const list = map.get(d.shortAddress) ?? [];
    list.push(d.deviceId);
    map.set(d.shortAddress, list);
  }
  return map;
};

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

export const DeviceMatchingEngine = {
  match(input: MatchInput): DeviceMatch[] {
    const now = input.now ?? (() => new Date().toISOString());
    const at = now();
    const shortAddressOwners = countShortAddresses(input.devices);
    const usedFixtureIds = new Set<string>();

    const results: DeviceMatch[] = [];

    for (const device of input.devices) {
      // ---- Pass 1: exact short-address match on same line
      let fixture: DesignFixture | undefined = input.designFixtures.find(
        f =>
          !usedFixtureIds.has(f.fixtureId) &&
          f.lineId === device.daliLineId &&
          device.shortAddress != null &&
          f.expectedShortAddress === device.shortAddress
      );

      // ---- Pass 2: same line + same device type
      if (!fixture) {
        fixture = input.designFixtures.find(
          f =>
            !usedFixtureIds.has(f.fixtureId) &&
            f.lineId === device.daliLineId &&
            sameType(f.expectedDeviceType, device.deviceType)
        );
      }

      // ---- Pass 3: same line only (ambiguous)
      if (!fixture) {
        fixture = input.designFixtures.find(
          f => !usedFixtureIds.has(f.fixtureId) && f.lineId === device.daliLineId
        );
      }

      const discrepancies: DeviceMatchDiscrepancy[] = [];
      let status: MatchStatus;
      let confidence: number | null;

      if (!fixture) {
        status = 'UNMATCHED';
        confidence = null;
        discrepancies.push({
          kind: 'MISSING_DEVICE',
          message: 'No matching fixture found in the design.',
          expected: null,
          actual: device.deviceType ?? device.randomAddress,
        });
      } else {
        usedFixtureIds.add(fixture.fixtureId);

        if (fixture.expectedDeviceType && !sameType(fixture.expectedDeviceType, device.deviceType)) {
          discrepancies.push({
            kind: 'TYPE_MISMATCH',
            message: 'Discovered device type differs from the design.',
            expected: fixture.expectedDeviceType,
            actual: device.deviceType ?? 'unknown',
          });
        }

        if (fixture.lineId !== device.daliLineId) {
          discrepancies.push({
            kind: 'LOCATION_MISMATCH',
            message: 'Device is on a different DALI line than the design expects.',
            expected: fixture.lineId,
            actual: device.daliLineId ?? 'unassigned',
          });
        }

        if (
          fixture.expectedShortAddress != null &&
          device.shortAddress != null &&
          fixture.expectedShortAddress !== device.shortAddress
        ) {
          discrepancies.push({
            kind: 'ADDRESS_MISMATCH',
            message: 'Short address differs from the design.',
            expected: `0x${fixture.expectedShortAddress.toString(16).toUpperCase()}`,
            actual: `0x${device.shortAddress.toString(16).toUpperCase()}`,
          });
        }

        const missing = fixture.requiredCapabilities.filter(
          c => !device.capabilities.some(dc => dc.toUpperCase() === c.toUpperCase())
        );
        if (missing.length > 0) {
          discrepancies.push({
            kind: 'CAPABILITY_MISMATCH',
            message: `Device lacks required capabilities: ${missing.join(', ')}.`,
            expected: fixture.requiredCapabilities.join(', '),
            actual: device.capabilities.join(', ') || 'none',
          });
        }

        if (discrepancies.length === 0) {
          status = 'MATCHED';
          confidence = 1;
        } else if (
          discrepancies.length === 1 &&
          discrepancies[0].kind === 'ADDRESS_MISMATCH'
        ) {
          // Address alone is not enough to break a match — flag it as ambiguous.
          status = 'AMBIGUOUS';
          confidence = 0.75;
        } else {
          status = 'CONFLICT';
          confidence = 0.4;
        }
      }

      // ---- Duplicate short-address detection (applies to both matched/unmatched)
      if (device.shortAddress != null) {
        const owners = shortAddressOwners.get(device.shortAddress) ?? [];
        if (owners.length > 1) {
          discrepancies.push({
            kind: 'DUPLICATE_ADDRESS',
            message: `Short address is shared by ${owners.length} devices.`,
            expected: null,
            actual: owners.join(', '),
          });
          if (status === 'MATCHED') {
            status = 'CONFLICT';
            confidence = Math.min(confidence ?? 0.4, 0.5);
          }
        }
      }

      results.push(
        createEmptyDeviceMatch({
          matchId: `match-${device.deviceId}`,
          sessionId: input.sessionId,
          deviceId: device.deviceId,
          fixtureId: fixture?.fixtureId ?? null,
          status,
          confidence,
          discrepancies,
          matchedAt: at,
        })
      );
    }

    // ---- Reverse pass: fixtures with no discovered device → MISSING_DEVICE on a synthetic match
    for (const f of input.designFixtures) {
      if (usedFixtureIds.has(f.fixtureId)) continue;
      results.push(
        createEmptyDeviceMatch({
          matchId: `match-missing-${f.fixtureId}`,
          sessionId: input.sessionId,
          deviceId: '',
          fixtureId: f.fixtureId,
          status: 'UNMATCHED',
          confidence: null,
          discrepancies: [
            {
              kind: 'MISSING_DEVICE',
              message: `Design fixture ${f.label ?? f.fixtureId} was not found during discovery.`,
              expected: f.fixtureId,
              actual: null,
            },
          ],
          matchedAt: at,
        })
      );
    }

    return results;
  },
};

/** Convenience: true if a discrepancy kind is "critical" (blocks commissioning). */
export const CRITICAL_DISCREPANCIES: DiscrepancyKind[] = [
  'TYPE_MISMATCH',
  'LOCATION_MISMATCH',
  'MISSING_DEVICE',
  'DUPLICATE_ADDRESS',
];

export const isCriticalDiscrepancy = (kind: DiscrepancyKind): boolean =>
  CRITICAL_DISCREPANCIES.includes(kind);