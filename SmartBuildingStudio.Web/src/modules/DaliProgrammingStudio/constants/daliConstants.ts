// src/modules/DaliProgrammingStudio/constants/daliConstants.ts

export const DALI_PROTOCOL_VERSION = 'IEC 62386';

export const DALI_BAUD_RATE = 1200;

/**
 * Standard DALI broadcast and group addresses.
 */
export const DALI_BROADCAST_ADDRESS = 255;
export const DALI_BROADCAST_GROUP = 255;

/**
 * Standard DALI special addresses for programming operations.
 */
export const DALI_SPECIAL_ADDRESS = {
  /** Used to reset to factory defaults or trigger specific states */
  RESET: 0xA5,
  /** Used to read memory banks */
  READ_MEMORY_LOCATION: 0xC1,
  /** Used to write memory banks */
  WRITE_MEMORY_LOCATION: 0xC3,
} as const;

/**
 * Physical limits of the DALI bus and protocol.
 */
export const DALI_HARD_LIMITS = {
  MAX_DEVICES_PER_LINE: 64,
  MAX_GROUPS: 16,
  MAX_SCENES: 16,
  MIN_SHORT_ADDRESS: 0,
  MAX_SHORT_ADDRESS: 63,
  // DALI-2 memory bank limits
  MAX_MEMORY_BANK: 255,
  MAX_MEMORY_LOCATION: 255,
} as const;