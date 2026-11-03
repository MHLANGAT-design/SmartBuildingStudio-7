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
      // 1. Run network sweep
      const testResults = await NetworkTestEngine.runNetworkSweep(gatewayId, lineId);

      // 2. Analyze failures into faults
      const newFaults = FaultDetectionEngine.analyzeTestResults(testResults);

      // 3. Merge faults into session (avoiding duplicates by faultId)
      const existingFaults = session.activeFaults ?? [];
      const existingFaultIds = new Set(existingFaults.map((f) => f.faultId));
      const uniqueNewFaults = newFaults.filter((f) => !existingFaultIds.has(f.faultId));

      return {
        ...session,
        activeFaults: [...existingFaults, ...uniqueNewFaults],
        // FIX: persist test results onto the session. Previously they were
        // consumed only by FaultDetectionEngine and discarded, so
        // recentTestResults stayed empty and Generate Report stayed gated.
        testResults: [...(session.testResults ?? []), ...testResults],
      };
    } catch (e: any) {
      console.error('[NetworkVerificationFlow] Failed:', e);
      return session;
    }
  }
}