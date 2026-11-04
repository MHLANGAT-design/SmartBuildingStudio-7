// src/modules/DaliProgrammingStudio/Services/ProgrammingService.ts

import type { ApprovedDaliDesign } from '@/modules/DaliProgrammingStudio/types/dali.types';
import type { ProgrammingPlan } from '@/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder';
import type { DeploymentResult } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentResult';
import type { DeploymentProgress } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentProgress';

import { DaliConfigurationCompiler } from '@/modules/DaliProgrammingStudio/Compiler/DaliConfigurationCompiler';
import { CommissioningApi } from '@/modules/Commissioning/services/CommissioningApi';
import { store } from '@/Application/ConfigureStore';

export class ProgrammingService {
  private compiler = new DaliConfigurationCompiler();

  /**
   * Step 1: Compile an approved design into a safe programming plan.
   * Stays in the frontend (pure data transformation, no hardware).
   */
  public compile(design: ApprovedDaliDesign): { plan: ProgrammingPlan | null; errors: any[] } {
    const { result, plan } = this.compiler.compile(design);

    if (!result.success) {
      return { plan: null, errors: result.errors };
    }
    return { plan, errors: [] };
  }

  /**
   * Step 2: Deploy the plan to the physical gateway via the backend.
   * Reads sessionId from the commissioning slice — the DaliProgrammingStudio
   * doesn't need to know about commissioning internals.
   */
  public async deploy(
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
      message: 'Sending deployment request to backend…',
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

    // FIX: Populate the arrays so the UI and alerts can read .length
    return {
      deploymentId: result.deploymentId,
      success: result.success,
      totalCommands: result.commandsSent,
      failedCommands: result.commandsFailed,
      successfulSequences: result.success ? plan.sequences : [],
      failedSequences: !result.success ? plan.sequences : [],
      errors: result.errorMessage ? [result.errorMessage] : [],
      completedAt: new Date().toISOString(),
    } as unknown as DeploymentResult;
  }
}