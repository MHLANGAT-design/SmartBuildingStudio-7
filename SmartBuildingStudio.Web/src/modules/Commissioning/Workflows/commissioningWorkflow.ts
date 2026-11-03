// src/modules/Commissioning/Workflows/commissioningWorkflow.ts

import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import { DeviceDiscoveryFlow } from '@/modules/Commissioning/Workflows/deviceDiscoveryFlow';
import { AddressingWorkflow } from '@/modules/Commissioning/Workflows/addressingWorkflow';
import { NetworkVerificationFlow } from '@/modules/Commissioning/Workflows/networkVerificationFlow';
import { SceneValidationFlow } from '@/modules/Commissioning/Workflows/sceneValidationFlow';
import { CompletionWorkflow } from '@/modules/Commissioning/Workflows/completionWorkflow';

export class CommissioningWorkflow {
  /**
   * Runs the full commissioning sequence: Discovery -> Addressing -> Testing -> Completion.
   */
  public static async runFullSequence(
    session: CommissioningSession,
    gatewayId: string,
    lineId: string,
    sceneIds: string[]
  ): Promise<CommissioningSession> {
    
    // Step 1: Discovery
    let currentSession = await DeviceDiscoveryFlow.execute(session, gatewayId, lineId);
    if (currentSession.status === 'FAILED') return currentSession;

    // Step 2: Addressing
    currentSession = await AddressingWorkflow.executeAutoAddressing(currentSession, lineId);

    // Step 3: Network Testing
    currentSession = await NetworkVerificationFlow.execute(currentSession, gatewayId, lineId);

    // Step 4: Scene Testing
    currentSession = await SceneValidationFlow.execute(currentSession, sceneIds);

    return currentSession;
  }
}