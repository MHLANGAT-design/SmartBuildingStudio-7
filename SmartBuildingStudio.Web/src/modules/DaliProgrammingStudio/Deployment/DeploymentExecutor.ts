// src/modules/DaliProgrammingStudio/Deployment/DeploymentExecutor.ts

import type { DeploymentPlan } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentPlan';
import type { DeploymentProgress } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentProgress';
import type { DeploymentCheckpoint } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentCheckpoint';
import type { DeploymentResult } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentResult';
import { createEmptyProgress } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentProgress';
import { DeploymentQueue } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentQueue';
import { DeploymentRecovery } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentRecovery';
import { DaliCommandExecutor } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandExecutor';
import type { ProgrammingFailureStrategy } from '@/modules/DaliProgrammingStudio/constants/programmingConstants';

export class DeploymentExecutor {
  private recovery = new DeploymentRecovery();

  constructor(
    private executor: DaliCommandExecutor,
    private failureStrategy: ProgrammingFailureStrategy
  ) {}

  public async execute(
    plan: DeploymentPlan,
    onProgress?: (progress: DeploymentProgress) => void
  ): Promise<DeploymentResult> {
    const queue = new DeploymentQueue(plan.programmingPlan.sequences);
    const progress = createEmptyProgress(plan.deploymentId, plan.programmingPlan.sequences.length);
    const startedAt = new Date().toISOString();
    const checkpoints: DeploymentCheckpoint[] = [];
    const successful: string[] = [];
    const failed: string[] = [];

    while (queue.hasRemaining()) {
      const sequence = queue.next();
      if (!sequence) break;

      progress.currentSequenceId = sequence.id;
      onProgress?.({ ...progress });

      const success = await this.executor.executeSequence(sequence);

      if (success) {
        queue.markCompleted(sequence.id);
        successful.push(sequence.id);
        progress.completedSequences++;
      } else {
        failed.push(sequence.id);
        progress.failedSequences++;

        if (this.failureStrategy === 'ABORT_ON_FAILURE') {
          progress.currentSequenceId = undefined;
          onProgress?.({ ...progress });
          return this.buildResult(plan, progress, successful, failed, queue.getSkippedIds(), checkpoints, startedAt, 'Aborted on failure');
        }
      }

      // Create checkpoint after each sequence
      checkpoints.push({
        checkpointId: `cp_${Date.now()}`,
        timestamp: new Date().toISOString(),
        lastCompletedSequenceId: success ? sequence.id : null,
        progress: { ...progress },
        canResume: true,
      });

      progress.percentage = Math.round((progress.completedSequences / progress.totalSequences) * 100);
      onProgress?.({ ...progress });
    }

    return this.buildResult(plan, progress, successful, failed, queue.getSkippedIds(), checkpoints, startedAt);
  }

  private buildResult(
    plan: DeploymentPlan,
    progress: DeploymentProgress,
    successful: string[],
    failed: string[],
    skipped: string[],
    checkpoints: DeploymentCheckpoint[],
    startedAt: string,
    errorMessage?: string
  ): DeploymentResult {
    return {
      deploymentId: plan.deploymentId,
      jobId: plan.programmingPlan.planId,
      success: failed.length === 0 && !errorMessage,
      partial: failed.length > 0 && successful.length > 0,
      totalSequences: progress.totalSequences,
      successfulSequences: successful,
      failedSequences: failed,
      skippedSequences: skipped,
      checkpoints,
      startedAt,
      completedAt: new Date().toISOString(),
      errorMessage,
    };
  }
}