// src/modules/Commissioning/utils/commissioningMetrics.ts

import type { TestResult } from '@/modules/Commissioning/models/TestResult';
import type { Fault } from '@/modules/Commissioning/models/Fault';

export interface CommissioningMetrics {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  criticalFaults: number;
}

export class CommissioningMetricsCalculator {
  public static calculate(results: TestResult[], faults: Fault[]): CommissioningMetrics {
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    for (const res of results) {
      if (res.status === 'PASS') passed++;
      else if (res.status === 'FAIL') failed++;
      else if (res.status === 'SKIPPED') skipped++;
    }

    const totalTests = results.length;
    const passRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;
    
    const criticalFaults = faults.filter(
      f => f.severity === 'CRITICAL' && !f.isResolved
    ).length;

    return {
      totalTests,
      passed,
      failed,
      skipped,
      passRate: Number(passRate.toFixed(1)),
      criticalFaults,
    };
  }
}