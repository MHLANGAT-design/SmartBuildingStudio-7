// src/modules/DaliProgrammingStudio/Deployment/DeploymentManager.ts

import type { ProgrammingPlan } from '@/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder';
import type { DeploymentResult } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentResult';
import type { DeploymentProgress } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentProgress';
import type { IGatewayAdapter } from '@/modules/DaliProgrammingStudio/types/gateway.types';
import type { ProgrammingFailureStrategy } from '@/modules/DaliProgrammingStudio/constants/programmingConstants';

import { DeploymentLockManager } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentLockManager';
import { DeploymentExecutor } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentExecutor';
import { DeploymentSession } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentSession';
import { DaliCommandExecutor } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandExecutor';
import { DaliCommandAudit } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandAudit';
import { DEFAULT_PROGRAMMING_OPTIONS } from '@/modules/DaliProgrammingStudio/constants/programmingConstants';

export class DeploymentManager {
  private lockManager = new DeploymentLockManager();

  constructor(private gateway: IGatewayAdapter, private audit: DaliCommandAudit) {}

  public async deploy(
    jobId: string,
    plan: ProgrammingPlan,
    gatewayId: string,
    targetLineId: string,
    onProgress?: (progress: DeploymentProgress) => void,
    failureStrategy: ProgrammingFailureStrategy = DEFAULT_PROGRAMMING_OPTIONS.failureStrategy
  ): Promise<DeploymentResult> {
    const deploymentId = `dep_${Date.now()}`;

    // 1. Acquire lock
    const locked = this.lockManager.acquireLock(gatewayId, targetLineId, deploymentId);
    if (!locked) {
      throw new Error(`Line ${targetLineId} on gateway ${gatewayId} is already locked by another deployment.`);
    }

    try {
      // 2. Build deployment plan
      const deploymentPlan = {
        deploymentId,
        programmingPlan: plan,
        gatewayId,
        targetLineId,
        createdAt: new Date().toISOString(),
        requiresConfirmation: true,
      };

      // 3. Create executor
      const commandExecutor = new DaliCommandExecutor(this.gateway, this.audit);
      const executor = new DeploymentExecutor(commandExecutor, failureStrategy);

      // 4. Run session
      const session = new DeploymentSession(deploymentPlan, executor);
      const result = await session.run(onProgress);

      return result;
    } finally {
      // 5. Always release lock
      this.lockManager.releaseLock(gatewayId, targetLineId);
    }
  }
}