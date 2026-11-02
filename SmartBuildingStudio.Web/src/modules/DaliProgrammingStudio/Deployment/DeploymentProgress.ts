// src/modules/DaliProgrammingStudio/Deployment/DeploymentProgress.ts

export interface DeploymentProgress {
  deploymentId: string;
  totalSequences: number;
  completedSequences: number;
  failedSequences: number;
  skippedSequences: number;
  currentSequenceId?: string;
  percentage: number;
  elapsedMs: number;
}

export function createEmptyProgress(deploymentId: string, totalSequences: number): DeploymentProgress {
  return {
    deploymentId,
    totalSequences,
    completedSequences: 0,
    failedSequences: 0,
    skippedSequences: 0,
    percentage: 0,
    elapsedMs: 0,
  };
}