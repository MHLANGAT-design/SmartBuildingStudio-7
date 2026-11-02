// src/modules/DaliProgrammingStudio/models/ProgrammingCommand.ts

import type { DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';

export class ProgrammingCommand {
  constructor(private readonly data: DaliCommand) {}

  get id(): string { return this.data.id; }
  get opcode(): number { return this.data.opcode; }
  get targetAddress(): number { return this.data.targetAddress; }
  get raw(): DaliCommand { return this.data; }

  public isBroadcast(): boolean {
    return this.data.targetType === 'BROADCAST';
  }
}