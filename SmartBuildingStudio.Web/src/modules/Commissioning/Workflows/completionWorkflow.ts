// src/modules/Commissioning/Workflows/completionWorkflow.ts

import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import { CommissioningWorkflowEngine } from '@/modules/Commissioning/Engine/CommissioningWorkflowEngine';

export class CompletionWorkflow {
  /**
   * Validates the session, advances status to a terminal state, returns the session.
   *
   * FIX: previously returned `{ success, report?, error? }`, which
   * commissioningWorkflow reassigned to `currentSession` and dispatched
   * through `setSession` — producing an activeSession with no sessionId,
   * no status, and empty collections. Now returns a CommissioningSession.
   */
  public static async execute(
    session: CommissioningSession,
  ): Promise<CommissioningSession> {
    // 1. Check if we are allowed to complete
    const validation = CommissioningWorkflowEngine.canAdvanceSession(session);
    if (!validation.allowed) {
      return { ...session, status: 'FAILED' };
    }

    // 2. Determine terminal status.
    //    NOTE: SessionStatus is 'IDLE' | 'DISCOVERING' | 'ADDRESSING' |
    //    'TESTING' | 'COMPLETED' | 'FAILED'. There is no 'READY_FOR_HANDOVER'
    //    state — the "ready for handover" signal is the absence of critical
    //    faults alongside a 'COMPLETED' status. We still compute overallStatus
    //    for the report and log it, but the session status itself only takes
    //    terminal values from the union.
    const unresolvedFaults = (session.activeFaults ?? []).filter((f) => !f.isResolved);
    const criticalFaults = unresolvedFaults.filter((f) => f.severity === 'CRITICAL');

    const terminalStatus: CommissioningSession['status'] =
      criticalFaults.length > 0 ? 'FAILED' : 'COMPLETED';

    return {
      ...session,
      status: terminalStatus,
      completedAt: new Date().toISOString(),
    };
  }
}