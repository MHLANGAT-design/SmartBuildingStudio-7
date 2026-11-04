// src/modules/DaliProgrammingStudio/Services/DeploymentService.ts

import type { DeploymentProgress } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentProgress';
import type { DeploymentResult } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentResult';
import type { ProgrammingPlan } from '@/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder';
import { CommissioningApi } from '@/modules/Commissioning/services/CommissioningApi';
import { store } from '@/Application/ConfigureStore';

/**
 * @deprecated Use ProgrammingService.deploy() directly.
 * Kept for backward compatibility with existing call sites.
 *
 * Signature now matches ProgrammingService.deploy():
 *   (plan, gatewayId, targetLineId, onProgress?)
 *
 * The sessionId is read from the commissioning slice — callers do not pass it.
 */
export class DeploymentService {
  public async startDeployment(
    plan: ProgrammingPlan,
    gatewayId: string,
    targetLineId: string,
    onProgress?: (progress: DeploymentProgress) => void,
  ): Promise<DeploymentResult> {
    const sessionId = (store.getState() as any)?.commissioning?.activeSession?.sessionId;

    if (!sessionId) {
      throw new Error('No active commissioning session. Start one before deploying.');
    }

    onProgress?.({
      status: 'running',
      percentComplete: 10,
      message: 'Sending deployment request…',
    });

    const result = await CommissioningApi.deployProgramming(
      plan,
      gatewayId,
      targetLineId,
      sessionId,
    );

    onProgress?.({
      status: result.success ? 'completed' : 'failed',
      percentComplete: 100,
      message: result.success
        ? `Deployment complete: ${result.commandsSent} commands sent`
        : `Deployment failed: ${result.errorMessage}`,
    });

    return {
      deploymentId: result.deploymentId,
      success: result.success,
      totalCommands: result.commandsSent,
      failedCommands: result.commandsFailed,
      errors: result.errorMessage ? [result.errorMessage] : [],
      completedAt: new Date().toISOString(),
    } as unknown as DeploymentResult;
  }
}