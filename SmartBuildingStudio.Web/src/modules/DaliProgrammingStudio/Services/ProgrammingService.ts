// src/modules/DaliProgrammingStudio/Services/ProgrammingService.ts

import type { ApprovedDaliDesign } from '@/modules/DaliProgrammingStudio/types/dali.types';
import type { ProgrammingPlan } from '@/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder';
import type { DeploymentResult } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentResult';
import type { DeploymentProgress } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentProgress';

import { DaliConfigurationCompiler } from '@/modules/DaliProgrammingStudio/Compiler/DaliConfigurationCompiler';
import { DeploymentManager } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentManager';
import type { IGatewayAdapter } from '@/modules/DaliProgrammingStudio/types/gateway.types';
import type { DaliCommandAudit } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandAudit';

export class ProgrammingService {
  private compiler = new DaliConfigurationCompiler();
  private deploymentManager: DeploymentManager;

  constructor(gateway: IGatewayAdapter, audit: DaliCommandAudit) {
    this.deploymentManager = new DeploymentManager(gateway, audit);
  }

  /**
   * Step 1: Compile an approved design into a safe programming plan.
   */
  public compile(design: ApprovedDaliDesign): { plan: ProgrammingPlan | null; errors: any[] } {
    const { result, plan } = this.compiler.compile(design);
    
    if (!result.success) {
      return { plan: null, errors: result.errors };
    }
    return { plan, errors: [] };
  }

  /**
   * Step 2: Deploy the plan to the physical gateway.
   * NOTE: Safety Rule #3 - This must ONLY be called after explicit user confirmation.
   */
  public async deploy(
    jobId: string,
    plan: ProgrammingPlan,
    gatewayId: string,
    targetLineId: string,
    onProgress?: (progress: DeploymentProgress) => void
  ): Promise<DeploymentResult> {
    return this.deploymentManager.deploy(jobId, plan, gatewayId, targetLineId, onProgress);
  }
}