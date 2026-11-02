// src/modules/DaliProgrammingStudio/Compiler/CommandOrderValidator.ts

import type { DaliCommandSequence } from '@/modules/DaliProgrammingStudio/types/command.types';
import type { CompilationError } from '@/modules/DaliProgrammingStudio/Compiler/CompilationResult';

export class CommandOrderValidator {
  public validate(orderedSequences: DaliCommandSequence[]): CompilationError[] {
    const errors: CompilationError[] = [];
    const completedIds = new Set<string>();

    for (const seq of orderedSequences) {
      // Check if all dependencies have already been completed in this ordered list
      for (const depId of seq.dependencies) {
        if (!completedIds.has(depId)) {
          errors.push({
            code: 'INVALID_EXECUTION_ORDER',
            message: `Sequence ${seq.id} depends on ${depId}, but it has not been executed yet.`,
            deviceId: seq.targetDeviceId,
            isFatal: true,
          });
        }
      }
      completedIds.add(seq.id);
    }

    return errors;
  }
}