// src/modules/DaliProgrammingStudio/models/ProgrammingError.ts

export class ProgrammingError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly targetId?: string,
    public readonly isCritical: boolean = false
  ) {
    super(message);
    this.name = 'ProgrammingError';
  }

  public static fromUnknown(error: unknown): ProgrammingError {
    if (error instanceof ProgrammingError) return error;
    if (error instanceof Error) {
      return new ProgrammingError('UNKNOWN_ERROR', error.message);
    }
    return new ProgrammingError('UNKNOWN_ERROR', String(error));
  }
}