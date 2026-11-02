// src/modules/DaliProgrammingStudio/Compiler/CommandDependencyResolver.ts

import type { DaliCommandSequence } from '@/modules/DaliProgrammingStudio/types/command.types';
import type { CompilationError } from '@/modules/DaliProgrammingStudio/Compiler/CompilationResult';

export class CommandDependencyResolver {
  /**
   * Sorts sequences so that dependencies are executed before the sequences that require them.
   * Also detects circular dependencies.
   */
  public resolve(sequences: DaliCommandSequence[]): { ordered: DaliCommandSequence[], errors: CompilationError[] } {
    const errors: CompilationError[] = [];
    const sequenceMap = new Map<string, DaliCommandSequence>();
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const ordered: DaliCommandSequence[] = [];

    for (const seq of sequences) {
      sequenceMap.set(seq.id, seq);
    }

    const visit = (seqId: string) => {
      if (visited.has(seqId)) return;
      if (visiting.has(seqId)) {
        errors.push({
          code: 'CIRCULAR_DEPENDENCY',
          message: `Circular dependency detected involving sequence ${seqId}`,
          isFatal: true,
        });
        return;
      }

      visiting.add(seqId);
      const seq = sequenceMap.get(seqId);
      
      if (seq) {
        for (const depId of seq.dependencies) {
          if (sequenceMap.has(depId)) {
            visit(depId);
          } else {
            // If dependency doesn't exist, it might have been skipped (e.g., device has no parameters)
            // This is fine, we just ignore it.
          }
        }
        visiting.delete(seqId);
        visited.add(seqId);
        ordered.push(seq);
      }
    };

    for (const seq of sequences) {
      visit(seq.id);
    }

    return { ordered, errors };
  }
}