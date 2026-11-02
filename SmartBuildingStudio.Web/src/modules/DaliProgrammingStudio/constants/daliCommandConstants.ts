// src/modules/DaliProgrammingStudio/constants/daliCommandConstants.ts

/**
 * High-level command categories used by the programming engine.
 */
export const DALI_COMMAND_CATEGORIES = {
  ADDRESSING: 'ADDRESSING',
  CONFIGURATION: 'CONFIGURATION',
  GROUPING: 'GROUPING',
  SCENE: 'SCENE',
  QUERY: 'QUERY',
  DIAGNOSTIC: 'DIAGNOSTIC',
  SYSTEM: 'SYSTEM',
} as const;

export type DaliCommandCategory = typeof DALI_COMMAND_CATEGORIES[keyof typeof DALI_COMMAND_CATEGORIES];

/**
 * Standard DALI command opcodes for configuration.
 */
export const DALI_OPCODES = {
  // Addressing
  PROGRAM_SHORT_ADDRESS: 0x80,
  VERIFY_SHORT_ADDRESS: 0xB0,
  QUERY_SHORT_ADDRESS: 0xBB,
  
  // Groups
  ADD_TO_GROUP: 0x40,
  REMOVE_FROM_GROUP: 0x50,
  QUERY_GROUPS: 0xC0,
  
  // Scenes
  STORE_SCENE: 0x40, // Overloads with group, depends on address
  RECALL_SCENE: 0x10,
  
  // System/Configuration
  SET_DTR0: 0xA3,
  SET_DTR1: 0xA5,
  SET_DTR2: 0xA7,
  READ_MEMORY_LOCATION: 0xC1,
  WRITE_MEMORY_LOCATION: 0xC3,
} as const;

/**
 * DALI Command Status Results.
 */
export const DALI_COMMAND_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  TIMEOUT: 'TIMEOUT',
  UNSUPPORTED: 'UNSUPPORTED',
  SKIPPED: 'SKIPPED',
  PENDING: 'PENDING',
} as const;

export type DaliCommandStatus = typeof DALI_COMMAND_STATUS[keyof typeof DALI_COMMAND_STATUS];