// src/modules/Commissioning/Workflows/faultDetectionFlow.ts

import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import type { Fault } from '@/modules/Commissioning/models/Fault';
import { FaultDetectionEngine } from '@/modules/Commissioning/Engine/FaultDetectionEngine';

/**
 * Sweeps the session for faults and returns an updated session with
 * newly-detected faults merged into activeFaults. New faults are
 * deduped against existing ones by faultId.
 *
 * Sources of faults, in order:
 *   1. Network states — any network/line currently marked disconnected
 *      or with errorCount > 0.
 *   2. Devices — any device with connectionStatus === 'FAULTY' or
 *      offline.
 *   3. Existing testResults — FaultDetectionEngine.analyzeTestResults
 *      produces faults for FAILED tests.
 */
export class FaultDetectionFlow {
  public static async execute(
    session: CommissioningSession,
  ): Promise<CommissioningSession> {
    const detected: Fault[] = [];

    // 1. Classify failing network states.
    const networks = Object.values(session.networkStates ?? {});
    for (const net of networks) {
      if (!net.isConnected) {
        detected.push({
          faultId: `net-disconnected-${net.lineId}`,
          category: 'NETWORK',
          description: `Line ${net.lineId} is disconnected.`,
          severity: 'HIGH',
          isResolved: false,
          detectedAt: new Date().toISOString(),
          resolvedAt: null,
          resolvedBy: null,
          deviceId: null,
          lineId: net.lineId,
          gatewayId: net.gatewayId,
        } as unknown as Fault);
      } else if (net.errorCount > 0) {
        detected.push({
          faultId: `net-errors-${net.lineId}`,
          category: 'NETWORK',
          description: `Line ${net.lineId} reported ${net.errorCount} errors.`,
          severity: 'MEDIUM',
          isResolved: false,
          detectedAt: new Date().toISOString(),
          resolvedAt: null,
          resolvedBy: null,
          deviceId: null,
          lineId: net.lineId,
          gatewayId: net.gatewayId,
        } as unknown as Fault);
      }
    }

    // 2. Classify faulted/offline devices.
    const devices = Object.values(session.deviceStates ?? {});
    for (const dev of devices) {
      if (dev.connectionStatus === 'FAULTY') {
        detected.push({
          faultId: `device-faulty-${dev.deviceId}`,
          category: 'DEVICE',
          description: `Device ${dev.deviceId} reports FAULTY.`,
          severity: 'HIGH',
          isResolved: false,
          detectedAt: new Date().toISOString(),
          resolvedAt: null,
          resolvedBy: null,
          deviceId: dev.deviceId,
          lineId: (dev.metadata as any)?.lineId ?? null,
          gatewayId: (dev.metadata as any)?.gatewayId ?? null,
        } as unknown as Fault);
      }
    }

    // 3. Classify test results.
    const testResults = (session as any).testResults ?? [];
    if (testResults.length > 0 && typeof (FaultDetectionEngine as any).analyzeTestResults === 'function') {
      try {
        const testFaults = (FaultDetectionEngine as any).analyzeTestResults(testResults) as Fault[];
        detected.push(...testFaults);
      } catch (e) {
        console.warn('[FaultDetectionFlow] analyzeTestResults failed:', e);
      }
    }

    const existingFaults = session.activeFaults ?? [];
    const existingIds = new Set(existingFaults.map((f) => f.faultId));
    const uniqueNew = detected.filter((f) => !existingIds.has(f.faultId));

    return {
      ...session,
      activeFaults: [...existingFaults, ...uniqueNew],
    };
  }
}