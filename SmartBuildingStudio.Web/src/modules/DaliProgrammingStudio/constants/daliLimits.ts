// src/modules/DaliProgrammingStudio/constants/daliLimits.ts

import { DALI_HARD_LIMITS } from './daliConstants';

/**
 * Module-specific limits and timeouts. 
 * These may be stricter than the DALI specification to ensure safe programming.
 */
export const DALI_PROGRAMMING_LIMITS = {
  // Maximum number of devices allowed in a single programming job batch
  MAX_BATCH_SIZE: 32,

  // Maximum number of retries for a failed command
  MAX_RETRIES: 3,

  // Maximum time to wait for a gateway response (in ms)
  COMMAND_TIMEOUT_MS: 1500,

  // Maximum time to wait for a device read-back (in ms)
  READ_BACK_TIMEOUT_MS: 3000,

  // Maximum time to wait for gateway connection (in ms)
  GATEWAY_CONNECT_TIMEOUT_MS: 5000,

  // Hardware limits (re-exported for convenience)
  MAX_DEVICES: DALI_HARD_LIMITS.MAX_DEVICES_PER_LINE,
  MAX_GROUPS: DALI_HARD_LIMITS.MAX_GROUPS,
  MAX_SCENES: DALI_HARD_LIMITS.MAX_SCENES,
  MIN_SHORT_ADDRESS: DALI_HARD_LIMITS.MIN_SHORT_ADDRESS,
  MAX_SHORT_ADDRESS: DALI_HARD_LIMITS.MAX_SHORT_ADDRESS,
} as const;

/**
 * Memory bank specific limits (DALI-2).
 */
export const DALI_MEMORY_LIMITS = {
  // DALI-2 Standard Memory Banks
  BANK_0_OEM: 0,
  BANK_1_GEAR: 1,
  BANK_2_USER: 2,
  BANK_201_DALI2: 201,
  BANK_202_DALI2: 202,
  BANK_203_DALI2: 203,
  MAX_BANK: DALI_HARD_LIMITS.MAX_MEMORY_BANK,
  MAX_LOCATION: DALI_HARD_LIMITS.MAX_MEMORY_LOCATION,
} as const;