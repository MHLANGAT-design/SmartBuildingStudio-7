// src/modules/DaliProgrammingStudio/Deployment/DeploymentSession.ts

import type { DeploymentPlan } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentPlan';
import type { DeploymentProgress } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentProgress';
import type { DeploymentResult } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentResult';
import type { DeploymentExecutor } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentExecutor';

export class DeploymentSession {
  public readonly sessionId: string;
  public readonly startedAt: string;
  private progress: DeploymentProgress | null = null;
  private result: DeploymentResult | null = null;

  constructor(
    public readonly plan: DeploymentPlan,
    private executor: DeploymentExecutor
  ) {
    this.sessionId = plan.deploymentId;
    this.startedAt = new Date().toISOString();
  }

  public async run(onProgress?: (progress: DeploymentProgress) => void): Promise<DeploymentResult> {
    this.result = await this.executor.execute(this.plan, (p) => {
      this.progress = p;
      onProgress?.(p);
    });
    return this.result;
  }

  public getProgress(): DeploymentProgress | null {
    return this.progress;
  }

  public getResult(): DeploymentResult | null {
    return this.result;
  }
}