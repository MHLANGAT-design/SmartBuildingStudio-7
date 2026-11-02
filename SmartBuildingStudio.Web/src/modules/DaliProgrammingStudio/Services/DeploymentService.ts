// src/modules/DaliProgrammingStudio/Services/DeploymentService.ts

import type { DeploymentPlan } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentPlan';
import type { DeploymentProgress } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentProgress';
import type { DeploymentResult } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentResult';
import type { ProgrammingPlan } from '@/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder';
import { DeploymentManager } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentManager';
import type { IGatewayAdapter } from '@/modules/DaliProgrammingStudio/types/gateway.types';
import type { DaliCommandAudit } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandAudit';

export class DeploymentService {
  private deploymentManager: DeploymentManager;

  constructor(gateway: IGatewayAdapter, audit: DaliCommandAudit) {
    this.deploymentManager = new DeploymentManager(gateway, audit);
  }

  public async startDeployment(
    jobId: string,
    plan: ProgrammingPlan,
    gatewayId: string,
    targetLineId: string,
    onProgress?: (progress: DeploymentProgress) => void
  ): Promise<DeploymentResult> {
    return this.deploymentManager.deploy(jobId, plan, gatewayId, targetLineId, onProgress);
  }
}