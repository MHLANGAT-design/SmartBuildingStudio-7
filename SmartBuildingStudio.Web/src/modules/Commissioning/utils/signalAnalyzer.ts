// src/modules/Commissioning/utils/signalAnalyzer.ts

import type { SignalLog } from '@/modules/Commissioning/models/SignalLog';

export const SIGNAL_THRESHOLDS = {
  MAX_RESPONSE_MS: 150, // DALI standard response time
  TIMEOUT_MS: 500,      // Point at which we consider the device unresponsive
} as const;

export class SignalAnalyzer {
  /**
   * Determines if a signal log indicates a healthy response.
   */
  public static isSignalHealthy(log: SignalLog): boolean {
    if (!log.success) return false;
    if (!log.responseReceived) return false;
    return log.responseTimeMs <= SIGNAL_THRESHOLDS.MAX_RESPONSE_MS;
  }

  /**
   * Calculates the average response time from a batch of logs.
   * Returns 0 if no successful logs exist.
   */
  public static calculateAverageResponse(logs: SignalLog[]): number {
    const successfulLogs = logs.filter(l => l.success && l.responseReceived);
    if (successfulLogs.length === 0) return 0;
    
    const total = successfulLogs.reduce((sum, log) => sum + log.responseTimeMs, 0);
    return total / successfulLogs.length;
  }

  /**
   * Identifies devices that have missed too many responses.
   */
  public static findUnresponsiveDevices(logs: SignalLog[], failureThreshold: number = 3): string[] {
    const failureCounts: Record<string, number> = {};
    
    for (const log of logs) {
      if (!log.success) {
        failureCounts[log.deviceId] = (failureCounts[log.deviceId] || 0) + 1;
      }
    }

    return Object.keys(failureCounts).filter(
      deviceId => failureCounts[deviceId] >= failureThreshold
    );
  }
}