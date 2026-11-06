// src/modules/DeviceDiscovery/Models/DiscoveredDevice.ts

/**
 * Frontend model for a physically discovered device.
 *
 * This is what DeviceDiscovery *found*; it is not the ProjectExplorer fixture.
 * Matching links a DiscoveredDevice to a design fixture via matchedFixtureId.
 */

export type DiscoveredDeviceStatus =
  | 'UNKNOWN'
  | 'IDENTIFIED'
  | 'MATCHED'
  | 'EXCEPTION';

/** DALI device type, kept as an open string so new backend values don't break the UI. */
export type DaliDeviceType = string;

export interface DiscoveredDevice {
  /** Stable id assigned by DeviceDiscovery (not the DALI short address). */
  deviceId: string;
  /** Session this device was found in. */
  sessionId: string;
  /** DALI random (long) address — 24-bit, as a hex string. */
  randomAddress: string;
  /** DALI short address — null until addressed. */
  shortAddress: number | null;
  /** DALI line this device was found on (ProjectExplorer identifier). */
  daliLineId: string | null;
  /** Device type reported during identification. */
  deviceType: DaliDeviceType | null;
  manufacturer: string | null;
  firmwareVersion: string | null;
  /** Status as recorded by DeviceDiscovery. */
  status: DiscoveredDeviceStatus;
  /** Liveness as last observed by the gateway. */
  isOnline: boolean;
  /** Capabilities reported by the device (names). */
  capabilities: string[];
  /** ProjectExplorer FixtureId this device was matched to, if any. */
  matchedFixtureId: string | null;
  /** Confidence 0–1 of the match, when matched. */
  matchConfidence: number | null;
  /** ISO-8601 timestamps. */
  discoveredAt: string;
  lastSeenAt: string | null;
}

/** Defaults used when mapping an incomplete/unknown backend DTO. */
export const createEmptyDiscoveredDevice = (
  partial: Partial<DiscoveredDevice> & { deviceId: string; sessionId: string; randomAddress: string }
): DiscoveredDevice => ({
  deviceId: partial.deviceId,
  sessionId: partial.sessionId,
  randomAddress: partial.randomAddress,
  shortAddress: partial.shortAddress ?? null,
  daliLineId: partial.daliLineId ?? null,
  deviceType: partial.deviceType ?? null,
  manufacturer: partial.manufacturer ?? null,
  firmwareVersion: partial.firmwareVersion ?? null,
  status: partial.status ?? 'UNKNOWN',
  isOnline: partial.isOnline ?? false,
  capabilities: partial.capabilities ?? [],
  matchedFixtureId: partial.matchedFixtureId ?? null,
  matchConfidence: partial.matchConfidence ?? null,
  discoveredAt: partial.discoveredAt ?? new Date().toISOString(),
  lastSeenAt: partial.lastSeenAt ?? null,
});

/** Human-friendly address label: short address in hex if present, else random address. */
export const formatDeviceAddress = (d: DiscoveredDevice): string => {
  if (d.shortAddress != null) {
    return `0x${d.shortAddress.toString(16).toUpperCase().padStart(2, '0')}`;
  }
  return d.randomAddress;
};