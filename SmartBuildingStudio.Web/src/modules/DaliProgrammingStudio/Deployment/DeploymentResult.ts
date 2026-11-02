// src/modules/DaliProgrammingStudio/Deployment/DeploymentResult.ts

import type { DeploymentCheckpoint } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentCheckpoint';

export interface DeploymentResult {
  deploymentId: string;
  jobId: string;
  success: boolean;
  partial: boolean;
  totalSequences: number;
  successfulSequences: string[];
  failedSequences: string[];
  skippedSequences: string[];
  checkpoints: DeploymentCheckpoint[];
  startedAt: string;
  completedAt: string;
  errorMessage?: string;
}