// src/modules/DaliProgrammingStudio/Commands/DaliCommandResult.ts

import type { DaliCommandStatus } from '@/modules/DaliProgrammingStudio/constants/daliCommandConstants';

export interface DaliCommandResult {
  commandId: string;
  sequenceId: string;
  status: DaliCommandStatus;
  attempts: number;
  durationMs: number;
  error?: string;
  timestamp: string;
}