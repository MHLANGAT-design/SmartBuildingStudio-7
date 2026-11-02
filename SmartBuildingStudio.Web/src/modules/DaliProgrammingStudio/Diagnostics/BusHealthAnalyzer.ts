// src/modules/DaliProgrammingStudio/Diagnostics/BusHealthAnalyzer.ts

import type { DiagnosticIssue } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';
import { DIAGNOSTIC_SEVERITY } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';

export class BusHealthAnalyzer {
  public analyze(successfulCommands: number, failedCommands: number, timeoutCommands: number): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const total = successfulCommands + failedCommands + timeoutCommands;

    if (total === 0) return issues;

    const failureRate = (failedCommands + timeoutCommands) / total;

    // High failure rate usually means physical wiring issue or bus overload
    if (failureRate > 0.1) {
      issues.push({
        issueId: `bus_health_${Date.now()}`,
        severity: DIAGNOSTIC_SEVERITY.CRITICAL,
        code: 'HIGH_BUS_FAILURE_RATE',
        message: `High DALI bus failure rate detected (${(failureRate * 100).toFixed(1)}%). Check physical wiring and terminators.`,
        recommendedAction: 'Inspect bus wiring, verify power supply, and check for missing terminators.',
      });
    } else if (failureRate > 0.02) {
      issues.push({
        issueId: `bus_health_${Date.now()}`,
        severity: DIAGNOSTIC_SEVERITY.WARNING,
        code: 'ELEVATED_BUS_FAILURE_RATE',
        message: `Elevated DALI bus failure rate (${(failureRate * 100).toFixed(1)}%). May indicate early sign of physical issues.`,
        recommendedAction: 'Monitor bus health closely.',
      });
    }

    return issues;
  }
}