// src/modules/Commissioning/services/apiConfig.ts

export const USE_MOCK = true;

/**
 * When true, CommissioningPage auto-fires runFullCommissioningWorkflow
 * as soon as the session is created. This runs discovery -> addressing
 * -> network test -> scene test -> fault detection in one shot, using
 * the first network line from the mock session.
 *
 * Set to false for real use — the engineer clicks the toolbar dialogs.
 */
export const USE_AUTO_FIRE = true;

export const mockDelay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const nowIso = (): string => new Date().toISOString();