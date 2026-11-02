// src/modules/DaliProgrammingStudio/types/deployment.types.ts

/**
 * A checkpoint represents a safe state to resume from if a deployment fails.
 */
export interface DeploymentCheckpoint {
  checkpointId: string;
  timestamp: string;
  lastCompletedSequenceId: string;
  successCount: number;
  failureCount: number;
}

/**
 * The definitive result of a deployment session.
 */
export interface DeploymentResult {
  deploymentId: string;
  jobId: string;
  success: boolean;
  totalSequences: number;
  successfulSequences: string[];
  failedSequences: string[];
  skippedSequences: string[];
  checkpoints: DeploymentCheckpoint[];
  startedAt: string;
  completedAt: string;
}