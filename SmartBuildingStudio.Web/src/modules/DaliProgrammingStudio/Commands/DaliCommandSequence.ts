// src/modules/DaliProgrammingStudio/Commands/DaliCommandSequence.ts

import { DaliCommand } from '@/modules/DaliProgrammingStudio/Commands/DaliCommand';
import type { DaliCommandSequence as DaliCommandSequenceDTO } from '@/modules/DaliProgrammingStudio/types/command.types';

export class DaliCommandSequence {
  public commands: DaliCommand[];
  public status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' = 'PENDING';

  constructor(public readonly dto: DaliCommandSequenceDTO) {
    this.commands = dto.commands.map(c => new DaliCommand(c));
  }

  get id(): string { return this.dto.id; }
  get targetDeviceId(): string | undefined { return this.dto.targetDeviceId; }
  get dependencies(): string[] { return this.dto.dependencies; }

  public markStarted(): void {
    this.status = 'RUNNING';
  }

  public markCompleted(): void {
    this.status = 'COMPLETED';
  }

  public markFailed(): void {
    this.status = 'FAILED';
  }

  public hasFailures(): boolean {
    return this.commands.some(c => c.status === 'FAILED' || c.status === 'TIMEOUT');
  }

  public isFullySuccessful(): boolean {
    return this.commands.every(c => c.status === 'SUCCESS');
  }
}