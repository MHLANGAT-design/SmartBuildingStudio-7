// src/modules/DaliProgrammingStudio/Deployment/DeploymentCheckpoint.ts

import type { DeploymentProgress } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentProgress';

export interface DeploymentCheckpoint {
  checkpointId: string;
  timestamp: string;
  lastCompletedSequenceId: string | null;
  progress: DeploymentProgress;
  canResume: boolean;
}