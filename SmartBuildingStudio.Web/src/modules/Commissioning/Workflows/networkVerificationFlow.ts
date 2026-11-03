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
    lineId: string
  ): Promise<CommissioningSession> {
    try {
      // 1. Run network sweep
      const testResults = await NetworkTestEngine.runNetworkSweep(gatewayId, lineId);

      // 2. Analyze failures into faults
      const newFaults = FaultDetectionEngine.analyzeTestResults(testResults);

      // 3. Merge faults into session (avoiding duplicates by faultId)
      const existingFaultIds = new Set(session.activeFaults.map(f => f.faultId));
      const uniqueNewFaults = newFaults.filter(f => !existingFaultIds.has(f.faultId));

      return {
        ...session,
        activeFaults: [...session.activeFaults, ...uniqueNewFaults],
      };
    } catch (e: any) {
      console.error('[NetworkVerificationFlow] Failed:', e);
      return session;
    }
  }
}