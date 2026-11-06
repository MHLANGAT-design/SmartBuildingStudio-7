// src/modules/DeviceDiscovery/Utilities/deviceAddressUtils.ts

/**
 * DALI address formatting and parsing.
 *
 * DALI has two addresses per device:
 *  - short address: 0–63 (6-bit), assigned during commissioning,
 *  - random (long) address: 24-bit, burned into the device at manufacture.
 *
 * Convention used throughout the module:
 *  - short addresses render as `0xNN` (two hex digits),
 *  - random addresses render as `0xNNNNNN` (six hex digits),
 *  - unaddressed devices render as `—`.
 */

import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';

const UNASSIGNED = '—';

/* ------------------------------------------------------------------ */
/* Short address                                                       */
/* ------------------------------------------------------------------ */

export const formatShortAddress = (short: number | null | undefined): string => {
  if (short == null || short < 0 || short > 63) return UNASSIGNED;
  return `0x${short.toString(16).toUpperCase().padStart(2, '0')}`;
};

export const parseShortAddress = (input: string): number | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const num = trimmed.toLowerCase().startsWith('0x')
    ? parseInt(trimmed.slice(2), 16)
    : parseInt(trimmed, 10);
  if (Number.isNaN(num) || num < 0 || num > 63) return null;
  return num;
};

export const isValidShortAddress = (short: number | null | undefined): boolean =>
  short != null && short >= 0 && short <= 63;

/* ------------------------------------------------------------------ */
/* Random (long) address                                               */
/* ------------------------------------------------------------------ */

export const formatRandomAddress = (
  random: string | null | undefined
): string => {
  if (!random) return UNASSIGNED;
  const cleaned = random.replace(/^0x/i, '').toUpperCase();
  if (!/^[0-9A-F]{1,6}$/.test(cleaned)) return random; // don't mangle unexpected input
  return `0x${cleaned.padStart(6, '0')}`;
};

export const parseRandomAddress = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/^0x/i, '').toUpperCase();
  if (!/^[0-9A-F]{1,6}$/.test(cleaned)) return null;
  return cleaned.padStart(6, '0');
};

/* ------------------------------------------------------------------ */
/* Device-level                                                        */
/* ------------------------------------------------------------------ */

/**
 * Human label for a device: short address if assigned, else random address.
 * Used by DiscoveredDeviceRow and the inspector header.
 */
export const formatDeviceAddress = (device: DiscoveredDevice): string => {
  if (isValidShortAddress(device.shortAddress)) {
    return formatShortAddress(device.shortAddress);
  }
  return formatRandomAddress(device.randomAddress);
};

/** Secondary label — the address *other* than the primary one. */
export const formatDeviceSecondaryAddress = (device: DiscoveredDevice): string => {
  if (isValidShortAddress(device.shortAddress)) {
    return formatRandomAddress(device.randomAddress);
  }
  return UNASSIGNED;
};

/** True if two devices share a short address (detection only — does not dedupe). */
export const shareShortAddress = (
  a: DiscoveredDevice,
  b: DiscoveredDevice
): boolean =>
  a.shortAddress != null &&
  b.shortAddress != null &&
  a.shortAddress === b.shortAddress;

/**
 * Find duplicate short addresses in a list of devices.
 * Returns a map from short address → list of device ids that share it.
 */
export const findDuplicateShortAddresses = (
  devices: DiscoveredDevice[]
): Map<number, string[]> => {
  const map = new Map<number, string[]>();
  for (const d of devices) {
    if (d.shortAddress == null) continue;
    const list = map.get(d.shortAddress) ?? [];
    list.push(d.deviceId);
    map.set(d.shortAddress, list);
  }
  // Keep only duplicates.
  const dups = new Map<number, string[]>();
  for (const [addr, ids] of map) {
    if (ids.length > 1) dups.set(addr, ids);
  }
  return dups;
};

/** Sort helper: by line, then short address (unaddressed last), then random. */
export const compareDevicesByAddress = (
  a: DiscoveredDevice,
  b: DiscoveredDevice
): number => {
  const lineA = a.daliLineId ?? '';
  const lineB = b.daliLineId ?? '';
  if (lineA !== lineB) return lineA.localeCompare(lineB);

  const shortA = isValidShortAddress(a.shortAddress) ? a.shortAddress! : Infinity;
  const shortB = isValidShortAddress(b.shortAddress) ? b.shortAddress! : Infinity;
  if (shortA !== shortB) return shortA - shortB;

  return a.randomAddress.localeCompare(b.randomAddress);
};