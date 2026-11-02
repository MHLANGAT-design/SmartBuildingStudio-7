// src/modules/DaliProgrammingStudio/Commands/DaliCommand.ts

import type { DaliCommand as DaliCommandDTO } from '@/modules/DaliProgrammingStudio/types/command.types';
import { DaliCommandStatus } from '@/modules/DaliProgrammingStudio/constants/daliCommandConstants';

export class DaliCommand {
  public status: DaliCommandStatus = 'PENDING';
  public attempts: number = 0;
  public lastAttemptAt?: string;
  public completedAt?: string;
  public error?: string;

  constructor(public readonly dto: DaliCommandDTO) {}

  get id(): string { return this.dto.id; }
  get opcode(): number { return this.dto.opcode; }
  get targetAddress(): number { return this.dto.targetAddress; }
  
  public markSuccess(): void {
    this.status = 'SUCCESS';
    this.completedAt = new Date().toISOString();
  }

  public markFailure(error: string): void {
    this.status = 'FAILED';
    this.error = error;
    this.completedAt = new Date().toISOString();
  }

  public markTimeout(): void {
    this.status = 'TIMEOUT';
    this.error = 'Command timed out';
    this.completedAt = new Date().toISOString();
  }

  public incrementAttempt(): void {
    this.attempts++;
    this.lastAttemptAt = new Date().toISOString();
  }
}