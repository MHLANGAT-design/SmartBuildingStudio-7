// src/modules/Commissioning/Workflows/faultResolutionFlow.ts

import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import { FaultService } from '@/modules/Commissioning/services/FaultService';

export class FaultResolutionFlow {
  /**
   * Resolves a fault and updates the session state.
   */
  public static async execute(
    session: CommissioningSession,
    faultId: string,
    resolutionNotes: string
  ): Promise<CommissioningSession> {
    try {
      // 1. Persist resolution to backend
      await FaultService.resolveFault(faultId, resolutionNotes);

      // 2. Update local session state
      const updatedFaults = session.activeFaults.map(f => {
        if (f.faultId === faultId) {
          return {
            ...f,
            isResolved: true,
            resolvedAt: new Date().toISOString(),
            resolutionNotes,
          };
        }
        return f;
      });

      return {
        ...session,
        activeFaults: updatedFaults,
      };
    } catch (e: any) {
      console.error('[FaultResolutionFlow] Failed:', e);
      return session;
    }
  }
}