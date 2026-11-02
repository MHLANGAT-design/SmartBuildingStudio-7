// src/modules/DaliProgrammingStudio/Deployment/DeploymentRecovery.ts

import type { DeploymentCheckpoint } from '@/modules/DaliProgrammingStudio/Deployment/DeploymentCheckpoint';
import type { DaliCommandSequence } from '@/modules/DaliProgrammingStudio/types/command.types';

export class DeploymentRecovery {
  /**
   * Filters the remaining sequences, removing any already completed before the checkpoint.
   */
  public resumeFromCheckpoint(
    checkpoint: DeploymentCheckpoint,
    remainingSequences: DaliCommandSequence[]
  ): DaliCommandSequence[] {
    if (!checkpoint.lastCompletedSequenceId) {
      return remainingSequences;
    }

    const lastCompletedIndex = remainingSequences.findIndex(
      s => s.id === checkpoint.lastCompletedSequenceId
    );

    if (lastCompletedIndex === -1) {
      return remainingSequences; // Safe fallback: run all
    }

    // Return only sequences AFTER the checkpoint
    return remainingSequences.slice(lastCompletedIndex + 1);
  }
}