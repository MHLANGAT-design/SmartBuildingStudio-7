// src/modules/DaliProgrammingStudio/constants/verificationConstants.ts

/**
 * The detailed result of a single read-back comparison.
 */
export const VERIFICATION_CHECK_RESULTS = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  NOT_SUPPORTED: 'NOT_SUPPORTED',
  NOT_TESTED: 'NOT_TESTED',
} as const;

export type VerificationCheckResult = typeof VERIFICATION_CHECK_RESULTS[keyof typeof VERIFICATION_CHECK_RESULTS];

/**
 * Tolerance limits for comparing numeric values (e.g., dimming levels).
 * Because DALI values are 0-254, we need to allow for slight fluctuations or rounding.
 */
export const VERIFICATION_TOLERANCES = {
  // Default tolerance for integer comparisons (exact match)
  EXACT: 0,
  // Tolerance for fade times or rates where 1 step of difference is acceptable
  LEVEL_TOLERANCE: 1,
} as const;