// src/modules/DaliProgrammingStudio/Commands/DaliCommandResponse.ts

export interface DaliCommandResponse {
  commandId: string;
  success: boolean;
  responseCode: number;
  rawResponse?: any;
  errorMessage?: string;
}