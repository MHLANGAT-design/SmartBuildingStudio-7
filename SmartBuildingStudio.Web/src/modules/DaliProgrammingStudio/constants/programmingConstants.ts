// src/modules/DaliProgrammingStudio/constants/programmingConstants.ts

/**
 * The frozen lifecycle states for a programming job, as defined in the Architecture Lock.
 */
export const PROGRAMMING_JOB_STATES = {
  DRAFT: 'Draft',
  DESIGN_LOADED: 'DesignLoaded',
  COMPILING: 'Compiling',
  COMPILED: 'Compiled',
  VALIDATING: 'Validating',
  VALIDATED: 'Validated',
  AWAITING_APPROVAL: 'AwaitingApproval',
  APPROVED: 'Approved',
  DEPLOYING: 'Deploying',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
} as const;

export type ProgrammingJobState = typeof PROGRAMMING_JOB_STATES[keyof typeof PROGRAMMING_JOB_STATES];

/**
 * The execution strategies for handling errors during programming.
 */
export const PROGRAMMING_FAILURE_STRATEGIES = {
  ABORT_ON_FAILURE: 'ABORT_ON_FAILURE',
  CONTINUE_ON_FAILURE: 'CONTINUE_ON_FAILURE',
  RETRY_ON_FAILURE: 'RETRY_ON_FAILURE',
} as const;

export type ProgrammingFailureStrategy = typeof PROGRAMMING_FAILURE_STRATEGIES[keyof typeof PROGRAMMING_FAILURE_STRATEGIES];

/**
 * Deployment verification statuses.
 */
export const VERIFICATION_STATUSES = {
  PENDING: 'PENDING',
  MATCHING: 'MATCHING',
  MISSING: 'MISSING',
  INCORRECT: 'INCORRECT',
  UNVERIFIED: 'UNVERIFIED',
  UNSUPPORTED: 'UNSUPPORTED',
} as const;

export type VerificationStatus = typeof VERIFICATION_STATUSES[keyof typeof VERIFICATION_STATUSES];

/**
 * Default programming options applied to new jobs.
 */
export const DEFAULT_PROGRAMMING_OPTIONS = {
  failureStrategy: PROGRAMMING_FAILURE_STRATEGIES.ABORT_ON_FAILURE,
  maxRetries: 3,
  verifyAfterDeployment: true,
  requireExplicitApproval: true,
} as const;