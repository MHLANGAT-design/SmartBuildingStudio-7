// src/modules/Commissioning/Workflows/completionWorkflow.ts

import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import type { CommissioningReport } from '@/modules/Commissioning/models/CommissioningReport';
import { CommissioningWorkflowEngine } from '@/modules/Commissioning/Engine/CommissioningWorkflowEngine';

export class CompletionWorkflow {
  /**
   * Validates that the session is ready for handover, then generates the report.
   */
  public static async execute(
    session: CommissioningSession
  ): Promise<{ success: boolean; report?: CommissioningReport; error?: string }> {
    // 1. Check if we are allowed to complete
    const validation = CommissioningWorkflowEngine.canAdvanceSession(session);
    if (!validation.allowed) {
      return { success: false, error: validation.reason };
    }

    // 2. Determine overall status
    const criticalFaults = session.activeFaults.filter(f => !f.isResolved && f.severity === 'CRITICAL').length;
    
    let overallStatus: CommissioningReport['overallStatus'] = 'READY_FOR_HANDOVER';
    if (criticalFaults > 0) {
      overallStatus = 'CRITICAL_FAILURE';
    } else if (session.activeFaults.some(f => !f.isResolved)) {
      overallStatus = 'REQUIRES_ATTENTION';
    }

    // 3. Generate the report structure
    const report: CommissioningReport = {
      reportId: `report-${Date.now()}`,
      sessionId: session.sessionId,
      projectId: session.projectId,
      generatedAt: new Date().toISOString(),
      totalDevices: Object.keys(session.deviceStates).length,
      testedDevices: Object.keys(session.deviceStates).length, // Assuming all are tested by now
      faults: session.activeFaults,
      testResults: [], // Would be passed in or fetched from state
      overallStatus,
    };

    // In a full implementation, we would POST this to the backend here.
    
    return { success: true, report };
  }
}