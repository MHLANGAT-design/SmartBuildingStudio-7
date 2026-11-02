// src/modules/DaliProgrammingStudio/constants/deploymentConstants.ts

/**
 * The states a deployment session can be in.
 */
export const DEPLOYMENT_STATES = {
  IDLE: 'IDLE',
  INITIALIZING: 'INITIALIZING',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type DeploymentState = typeof DEPLOYMENT_STATES[keyof typeof DEPLOYMENT_STATES];

/**
 * Configuration for how the deployment engine handles the queue.
 */
export const DEPLOYMENT_OPTIONS = {
  // Default time to wait between sending commands to avoid overloading the bus
  INTER_COMMAND_DELAY_MS: 50,
  // Default time to wait between processing batches of devices
  INTER_BATCH_DELAY_MS: 250,
} as const;