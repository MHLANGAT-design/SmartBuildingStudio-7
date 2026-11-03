// src/modules/Commissioning/Engine/FaultDetectionEngine.ts

import type { TestResult } from '@/modules/Commissioning/models/TestResult';
import type { Fault } from '@/modules/Commissioning/models/Fault';
import { FaultClassifier } from '@/modules/Commissioning/utils/faultClassifier';

export class FaultDetectionEngine {
  /**
   * Parses test results to identify faults.
   */
  public static analyzeTestResults(results: TestResult[]): Fault[] {
    const faults: Fault[] = [];

    const failedTests = results.filter(r => r.status === 'FAIL');
    
    // Group failures by target to avoid flooding with duplicate faults
    const failuresByTarget = failedTests.reduce((acc, test) => {
      acc[test.targetId] = (acc[test.targetId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [targetId, count] of Object.entries(failuresByTarget)) {
      faults.push(
        FaultClassifier.classify(
          'SIGNAL_MISMATCH',
          targetId,
          `Device failed ${count} signal tests.`,
          count
        )
      );
    }

    return faults;
  }
}