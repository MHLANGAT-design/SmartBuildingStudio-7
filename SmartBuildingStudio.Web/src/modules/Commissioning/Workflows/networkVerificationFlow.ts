// src/modules/Commissioning/Workflows/networkVerificationFlow.ts

import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import { NetworkTestEngine } from '@/modules/Commissioning/Engine/NetworkTestEngine';
import { FaultDetectionEngine } from '@/modules/Commissioning/Engine/FaultDetectionEngine';

export class NetworkVerificationFlow {
  /**
   * Tests the network, detects faults, and merges them into the session.
   */
  public static async execute(
    session: CommissioningSession,
    gatewayId: string,
    lineId: string,
  ): Promise<CommissioningSession> {
    try {
      const testResults = await NetworkTestEngine.runNetworkSweep(
        gatewayId,
        lineId,
        session.sessionId,
      );

      const newFaults = FaultDetectionEngine.analyzeTestResults(testResults);

      const existingFaults = session.activeFaults ?? [];
      const existingFaultIds = new Set(existingFaults.map((f) => f.faultId));
      const uniqueNewFaults = newFaults.filter((f) => !existingFaultIds.has(f.faultId));

      return {
        ...session,
        activeFaults: [...existingFaults, ...uniqueNewFaults],
        testResults: [...(session.testResults ?? []), ...testResults],
      };
    } catch (e: any) {
      console.error('[NetworkVerificationFlow] Failed:', e);
      return session;
    }
  }
}