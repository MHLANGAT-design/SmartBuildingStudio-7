// src/modules/DaliProgrammingStudio/Commands/DaliCommandError.ts

export class DaliCommandError extends Error {
  constructor(
    public readonly commandId: string,
    public readonly code: string,
    message: string,
    public readonly isRecoverable: boolean = true
  ) {
    super(message);
    this.name = 'DaliCommandError';
  }

  public static fromUnknown(commandId: string, error: unknown): DaliCommandError {
    if (error instanceof DaliCommandError) return error;
    if (error instanceof Error) {
      return new DaliCommandError(commandId, 'UNKNOWN', error.message, true);
    }
    return new DaliCommandError(commandId, 'UNKNOWN', String(error), true);
  }
}