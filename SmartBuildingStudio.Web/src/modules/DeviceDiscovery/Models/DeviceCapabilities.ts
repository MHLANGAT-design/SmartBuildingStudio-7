// src/modules/DeviceDiscovery/Models/DeviceCapabilities.ts

/**
 * Frontend model for a discovered device's capabilities.
 *
 * Capabilities are named flags (e.g. "DIMMABLE", "COLOR_TEMPERATURE",
 * "EMERGENCY"). This model gives the UI a typed way to group them and to
 * answer "does this device support X?" without string-matching at call sites.
 */

export type KnownCapability =
  | 'DIMMABLE'
  | 'COLOR_TEMPERATURE'
  | 'FULL_COLOR'
  | 'EMERGENCY'
  | 'SENSOR'
  | 'BATTERY_BACKED';

export interface DeviceCapabilities {
  deviceId: string;
  /** Raw capability names as reported — kept for forward-compat display. */
  raw: string[];
  /** Typed flags derived from `raw`; unknown names are ignored here. */
  flags: Record<KnownCapability, boolean>;
}

const KNOWN_CAPABILITIES: KnownCapability[] = [
  'DIMMABLE',
  'COLOR_TEMPERATURE',
  'FULL_COLOR',
  'EMERGENCY',
  'SENSOR',
  'BATTERY_BACKED',
];

export const buildDeviceCapabilities = (
  deviceId: string,
  raw: string[] | null | undefined
): DeviceCapabilities => {
  const list = raw ?? [];
  const upper = list.map(c => c.toUpperCase());
  const flags = KNOWN_CAPABILITIES.reduce((acc, cap) => {
    acc[cap] = upper.includes(cap);
    return acc;
  }, {} as Record<KnownCapability, boolean>);
  return { deviceId, raw: list, flags };
};

export const hasCapability = (
  caps: DeviceCapabilities | null,
  capability: KnownCapability
): boolean => !!caps && caps.flags[capability] === true;

export const EMPTY_DEVICE_CAPABILITIES: DeviceCapabilities = {
  deviceId: '',
  raw: [],
  flags: KNOWN_CAPABILITIES.reduce((acc, cap) => {
    acc[cap] = false;
    return acc;
  }, {} as Record<KnownCapability, boolean>),
};