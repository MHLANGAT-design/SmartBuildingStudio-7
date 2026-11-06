// src/modules/DeviceDiscovery/Engine/DiscoveryResultEngine.ts

/**
 * DiscoveryResultEngine
 *
 * Computes the aggregate DiscoveryResult (counts + exceptions) from:
 *  - the discovered devices,
 *  - their identifications,
 *  - their matches,
 *
 * Pure function. Called after discovery + identification + matching to
 * produce the summary the DiscoveryResults/ panel renders.
 */

import type { DiscoveredDevice, DiscoveredDeviceStatus } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';
import type { DeviceIdentification } from '@/modules/DeviceDiscovery/Models/DeviceIdentification';
import type { DeviceMatch } from '@/modules/DeviceDiscovery/Models/DeviceMatch';
import type {
  DiscoveryException,
  DiscoveryExceptionKind,
  DiscoveryResult,
  DiscoveryResultCounts,
} from '@/modules/DeviceDiscovery/Models/DiscoveryResult';
import { EMPTY_RESULT_COUNTS } from '@/modules/DeviceDiscovery/Models/DiscoveryResult';

export interface ComputeResultInput {
  sessionId: string;
  devices: DiscoveredDevice[];
  identifications: Record<string, DeviceIdentification>;
  matches: DeviceMatch[];
  now?: () => string;
}

/* ------------------------------------------------------------------ */
/* Exception derivation                                                */
/* ------------------------------------------------------------------ */

const exceptionsFrom = (
  input: ComputeResultInput,
  at: string
): DiscoveryException[] => {
  const out: DiscoveryException[] = [];
  const matchByDevice = new Map<string, DeviceMatch>();
  for (const m of input.matches) {
    if (m.deviceId) matchByDevice.set(m.deviceId, m);
  }

  for (const device of input.devices) {
    const ident = input.identifications[device.deviceId];

    // No identification result → UNIDENTIFIED exception.
    if (!ident) {
      out.push({
        exceptionId: `ex-unid-${device.deviceId}`,
        kind: 'UNIDENTIFIED',
        deviceId: device.deviceId,
        fixtureId: null,
        message: 'Device was discovered but not identified.',
        recordedAt: at,
      });
      continue;
    }

    if (ident.status === 'FAILED') {
      out.push({
        exceptionId: `ex-ident-fail-${device.deviceId}`,
        kind: 'COMMUNICATION_ERROR',
        deviceId: device.deviceId,
        fixtureId: null,
        message: ident.errorMessage ?? 'Identification failed.',
        recordedAt: ident.completedAt ?? at,
      });
      continue;
    }

    // Match status drives the rest.
    const match = matchByDevice.get(device.deviceId);
    if (!match) {
      out.push({
        exceptionId: `ex-unmatched-${device.deviceId}`,
        kind: 'UNMATCHED',
        deviceId: device.deviceId,
        fixtureId: null,
        message: 'Device was identified but not matched to the design.',
        recordedAt: at,
      });
      continue;
    }

    for (const d of match.discrepancies) {
      const kind: DiscoveryExceptionKind =
        d.kind === 'DUPLICATE_ADDRESS' ? 'ADDRESS_CONFLICT'
        : d.kind === 'MISSING_DEVICE' ? 'UNEXPECTED_DEVICE'
        : 'UNMATCHED';
      out.push({
        exceptionId: `ex-disc-${device.deviceId}-${d.kind}`,
        kind,
        deviceId: device.deviceId,
        fixtureId: match.fixtureId,
        message: d.message,
        recordedAt: at,
      });
    }
  }

  // Matches with no device → MISSING_FROM_DESIGN (fixture expected, no device found).
  for (const m of input.matches) {
    if (m.deviceId) continue;
    out.push({
      exceptionId: `ex-missing-${m.fixtureId ?? m.matchId}`,
      kind: 'MISSING_FROM_DESIGN',
      deviceId: null,
      fixtureId: m.fixtureId,
      message: m.discrepancies[0]?.message ?? 'A design fixture was not found.',
      recordedAt: at,
    });
  }

  return out;
};

/* ------------------------------------------------------------------ */
/* Counts                                                              */
/* ------------------------------------------------------------------ */

const deriveStatus = (
  device: DiscoveredDevice,
  match: DeviceMatch | undefined
): DiscoveredDeviceStatus => {
  if (match && match.status === 'MATCHED') return 'MATCHED';
  if (match && match.status === 'UNMATCHED' && match.discrepancies.length === 0) {
    return 'IDENTIFIED';
  }
  if (match && (match.status === 'CONFLICT' || match.status === 'AMBIGUOUS')) {
    return 'EXCEPTION';
  }
  if (device.manufacturer && device.deviceType) return 'IDENTIFIED';
  return 'UNKNOWN';
};

const deriveCounts = (
  input: ComputeResultInput,
  exceptions: DiscoveryException[]
): DiscoveryResultCounts => {
  const byStatus: DiscoveryResultCounts['byStatus'] = {
    UNKNOWN: 0,
    IDENTIFIED: 0,
    MATCHED: 0,
    EXCEPTION: 0,
  };
  const matchByDevice = new Map<string, DeviceMatch>();
  for (const m of input.matches) {
    if (m.deviceId) matchByDevice.set(m.deviceId, m);
  }

  let matched = 0;
  for (const d of input.devices) {
    const status = deriveStatus(d, matchByDevice.get(d.deviceId));
    byStatus[status] += 1;
    if (status === 'MATCHED') matched += 1;
  }

  return {
    totalDiscovered: input.devices.length,
    identified: byStatus.IDENTIFIED + byStatus.MATCHED + byStatus.EXCEPTION,
    matched,
    exceptions: exceptions.length,
    byStatus,
  };
};

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

export const DiscoveryResultEngine = {
  compute(input: ComputeResultInput): DiscoveryResult {
    const at = (input.now ?? (() => new Date().toISOString()))();
    const exceptions = exceptionsFrom(input, at);
    const counts = deriveCounts(input, exceptions);

    return {
      sessionId: input.sessionId,
      counts: { ...EMPTY_RESULT_COUNTS, ...counts, byStatus: counts.byStatus },
      exceptions,
      computedAt: at,
    };
  },

  /** Exposed for the summary cards — returns the counts alone. */
  computeCounts(input: ComputeResultInput): DiscoveryResultCounts {
    const at = (input.now ?? (() => new Date().toISOString()))();
    const exceptions = exceptionsFrom(input, at);
    return deriveCounts(input, exceptions);
  },
};