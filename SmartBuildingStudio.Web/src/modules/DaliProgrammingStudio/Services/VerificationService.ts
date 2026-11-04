// src/modules/DaliProgrammingStudio/Services/VerificationService.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { VerificationReport } from '@/modules/DaliProgrammingStudio/Verification/VerificationReport';
import { CommissioningApi } from '@/modules/Commissioning/services/CommissioningApi';
import { store } from '@/Application/ConfigureStore';

export class VerificationService {
  /**
   * Step 3: Verify the deployment against the physical gateway.
   * The backend handles the read-back; the frontend provides the expected design.
   */
  public async verifyDeployment(
    deploymentId: string,
    devices: DaliDeviceDefinition[]
  ): Promise<VerificationReport> {
    const sessionId = (store.getState() as any)?.commissioning?.activeSession?.sessionId;

    if (!sessionId) {
      throw new Error('No active commissioning session. Start one before verifying.');
    }

    const result = await CommissioningApi.verifyProgramming(deploymentId, devices, sessionId);

    return {
      deploymentId: result.deploymentId,
      isFullyVerified: result.isFullyVerified,
      verifiedAt: result.verifiedAt,
      summary: {
        matchingDevices: result.summary.matchingDevices,
        mismatchedDevices: result.summary.mismatchedDevices,
        passed: result.summary.passed,
        failed: result.summary.failed,
      },
      results: result.results,
    } as unknown as VerificationReport;
  }
}