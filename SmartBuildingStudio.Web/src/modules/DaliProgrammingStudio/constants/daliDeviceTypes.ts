// src/modules/DaliProgrammingStudio/constants/daliDeviceTypes.ts

/**
 * DALI-2 Device Type mapping (IEC 62386-1xx).
 * Used to determine which capability profile applies to a device.
 */
export const DALI_DEVICE_TYPES = {
  FLUORESCENT_LAMP: 0,
  EMERGENCY_LIGHTING: 1,
  DISCHARGE_LAMP: 2,
  LOW_VOLTAGE_HALOGEN: 3,
  INCANDESCENT_DIMMER: 4,
  DC_CONVERTER: 5,
  LED_MODULE: 6,
  SWITCHING_FUNCTION: 7,
  COLOUR_CONTROL: 8,
  SEQUENCER: 9,
  // Control Devices (Input units)
  PUSH_BUTTON: 10,
  OCCUPANCY_SENSOR: 11,
  LIGHT_SENSOR: 12,
} as const;

export type DaliDeviceType = typeof DALI_DEVICE_TYPES[keyof typeof DALI_DEVICE_TYPES];

/**
 * The operational role of the device on the bus.
 */
export const DALI_DEVICE_ROLES = {
  CONTROL_GEAR: 'CONTROL_GEAR',       // e.g., LED drivers, ballasts
  CONTROL_DEVICE: 'CONTROL_DEVICE',   // e.g., sensors, push buttons
  APPLICATION_CONTROLLER: 'APPLICATION_CONTROLLER', // e.g., Gateways, bus masters
  UNKNOWN: 'UNKNOWN',
} as const;

export type DaliDeviceRole = typeof DALI_DEVICE_ROLES[keyof typeof DALI_DEVICE_ROLES];

/**
 * D4i specific device characteristics.
 */
export const DALI_D4I_TYPES = {
  INTEGRATED_POWER_SUPPLY: 'INTEGRATED_POWER_SUPPLY',
  INTEGRATED_BUS_POWER_SUPPLY: 'INTEGRATED_BUS_POWER_SUPPLY',
  PART_250_SENSOR: 'PART_250_SENSOR',
  PART_251_DATA: 'PART_251_DATA',
  PART_252_ENERGY: 'PART_252_ENERGY',
  PART_253_DIAGNOSTICS: 'PART_253_DIAGNOSTICS',
} as const;

export type DaliD4iType = typeof DALI_D4I_TYPES[keyof typeof DALI_D4I_TYPES];