// src/modules/Commissioning/Engine/NetworkTestEngine.ts

import type { TestResult } from '@/modules/Commissioning/models/TestResult';
import { TestService } from '@/modules/Commissioning/services/TestService';
import { CommissioningMetricsCalculator } from '@/modules/Commissioning/utils/commissioningMetrics';

export class NetworkTestEngine {
  /**
   * Runs a full sweep of a network line.
   */
  public static async runNetworkSweep(gatewayId: string, lineId: string): Promise<TestResult[]> {
    const results = await TestService.testNetworkLine(gatewayId, lineId);
    
    // Ensure all results are marked with the correct test type
    return results.map(r => ({
      ...r,
      testType: 'NETWORK'
    }));
  }
}