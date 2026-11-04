// src/modules/Commissioning/Engine/NetworkTestEngine.ts

import type { TestResult } from '@/modules/Commissioning/models/TestResult';
import { TestService } from '@/modules/Commissioning/services/TestService';
import { CommissioningMetricsCalculator } from '@/modules/Commissioning/utils/commissioningMetrics';

export class NetworkTestEngine {
  /**
   * Runs a full sweep of a network line.
   */
  public static async runNetworkSweep(
    gatewayId: string,
    lineId: string,
    sessionId: string,
  ): Promise<TestResult[]> {
    const results = await TestService.testNetworkLine(gatewayId, lineId, sessionId);

    return results.map(r => ({
      ...r,
      testType: 'NETWORK'
    }));
  }
}