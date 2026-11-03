// src/modules/Commissioning/Engine/CommissioningWorkflowEngine.ts

import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import { NetworkValidator } from '@/modules/Commissioning/utils/networkValidator';

export class CommissioningWorkflowEngine {
  /**
   * Validates if the session is ready to move to the next step.
   */
  public static canAdvanceSession(session: CommissioningSession): { allowed: boolean; reason?: string } {
    if (session.status === 'IDLE') {
      return { allowed: true };
    }

    if (session.status === 'DISCOVERING') {
      const deviceCount = Object.keys(session.deviceStates).length;
      if (deviceCount === 0) {
        return { allowed: false, reason: 'Must discover at least one device before addressing.' };
      }
    }

    if (session.status === 'ADDRESSING') {
      const unaddressed = Object.values(session.deviceStates).filter(d => !d.isAddressed);
      if (unaddressed.length > 0) {
        return { allowed: false, reason: `${unaddressed.length} devices still need addressing.` };
      }
    }

    if (session.status === 'TESTING') {
      if (session.activeFaults.filter(f => f.severity === 'CRITICAL').length > 0) {
        return { allowed: false, reason: 'Resolve CRITICAL faults before completing commissioning.' };
      }
    }

    return { allowed: true };
  }
}