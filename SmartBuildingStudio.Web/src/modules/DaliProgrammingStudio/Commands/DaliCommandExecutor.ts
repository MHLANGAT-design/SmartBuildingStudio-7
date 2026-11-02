// src/modules/DaliProgrammingStudio/Commands/DaliCommandExecutor.ts

import type { DaliCommandSequence as SequenceDTO } from '@/modules/DaliProgrammingStudio/types/command.types';
import type { IGatewayAdapter } from '@/modules/DaliProgrammingStudio/types/gateway.types';
import { DaliCommandSequence } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandSequence';
import { DaliCommandAudit } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandAudit';
import { DaliCommandValidator } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandValidator';
import { DaliCommandError } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandError';
import { withTimeout } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandTimeout';
import { DALI_PROGRAMMING_LIMITS } from '@/modules/DaliProgrammingStudio/constants/daliLimits';

export class DaliCommandExecutor {
  private validator = new DaliCommandValidator();

  constructor(
    private gateway: IGatewayAdapter,
    private audit: DaliCommandAudit
  ) {}

  public async executeSequence(sequenceDTO: SequenceDTO): Promise<boolean> {
    const sequence = new DaliCommandSequence(sequenceDTO);
    sequence.markStarted();

    for (const command of sequence.commands) {
      // 1. Validate
      const validation = this.validator.validateCommand(command.dto);
      if (!validation.valid) {
        command.markFailure(validation.reason || 'Validation failed');
        sequence.markFailed();
        this.recordAudit(command.id, sequence.id, command.status, 0, validation.reason);
        return false;
      }

      // 2. Execute with Timeout
      command.incrementAttempt();
      const startTime = Date.now();

      try {
        const response = await withTimeout(
          this.gateway.sendCommand(command.dto),
          DALI_PROGRAMMING_LIMITS.COMMAND_TIMEOUT_MS
        );

        const duration = Date.now() - startTime;

        if (response.success) {
          command.markSuccess();
          this.recordAudit(command.id, sequence.id, command.status, duration);
        } else {
          command.markFailure(response.error || 'Gateway reported failure');
          sequence.markFailed();
          this.recordAudit(command.id, sequence.id, command.status, duration, response.error);
          return false; // Stop sequence on failure
        }
      } catch (e: unknown) {
        const duration = Date.now() - startTime;
        const err = DaliCommandError.fromUnknown(command.id, e);
        command.markFailure(err.message);
        sequence.markFailed();
        this.recordAudit(command.id, sequence.id, command.status, duration, err.message);
        return false; // Stop sequence on error
      }
    }

    sequence.markCompleted();
    return true;
  }

  private recordAudit(commandId: string, sequenceId: string, status: any, duration: number, error?: string): void {
    this.audit.record({
      commandId,
      sequenceId,
      status,
      attempts: 1,
      durationMs: duration,
      error,
      timestamp: new Date().toISOString()
    });
  }
}