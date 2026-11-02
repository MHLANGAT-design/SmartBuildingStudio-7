// src/modules/DaliProgrammingStudio/models/ProgrammingInstruction.ts

import type { DaliCommandSequence } from '@/modules/DaliProgrammingStudio/types/command.types';

export class ProgrammingInstruction {
  constructor(private readonly sequence: DaliCommandSequence) {}

  get id(): string { return this.sequence.id; }
  get dependencies(): string[] { return this.sequence.dependencies; }
  get commandCount(): number { return this.sequence.commands.length; }
  get raw(): DaliCommandSequence { return this.sequence; }

  public hasDependencies(): boolean {
    return this.sequence.dependencies.length > 0;
  }
}