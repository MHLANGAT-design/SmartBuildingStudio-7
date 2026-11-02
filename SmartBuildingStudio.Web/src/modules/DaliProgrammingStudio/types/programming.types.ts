// src/modules/DaliProgrammingStudio/types/programming.types.ts

import type { ProgrammingJobState, ProgrammingFailureStrategy } from '@/modules/DaliProgrammingStudio/constants/programmingConstants';

/**
 * Options that dictate how a programming job behaves.
 */
export interface ProgrammingOptions {
  failureStrategy: ProgrammingFailureStrategy;
  maxRetries: number;
  verifyAfterDeployment: boolean;
  requireExplicitApproval: boolean;
}

/**
 * The main data structure representing a programming job.
 */
export interface ProgrammingJob {
  jobId: string;
  projectId: string;
  designRevisionId: string;
  state: ProgrammingJobState;
  options: ProgrammingOptions;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  
  // Results
  totalSequences: number;
  completedSequences: number;
  failedSequences: number;
  warnings: string[];
  errors: string[];
}