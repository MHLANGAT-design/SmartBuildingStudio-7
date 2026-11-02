// src/modules/DaliProgrammingStudio/Compiler/CompilationResult.ts

import type { ProgrammingInstruction } from '@/modules/DaliProgrammingStudio/models/ProgrammingInstruction';

export interface CompilationWarning {
  code: string;
  message: string;
  deviceId?: string;
}

export interface CompilationError {
  code: string;
  message: string;
  deviceId?: string;
  isFatal: boolean;
}

export interface CompilationResult {
  success: boolean;
  planId: string;
  designRevisionId: string;
  instructions: ProgrammingInstruction[];
  warnings: CompilationWarning[];
  errors: CompilationError[];
  compiledAt: string;
}