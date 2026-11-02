// src/modules/DaliProgrammingStudio/Compiler/ProgrammingPlanBuilder.ts

import type { DaliCommandSequence } from '@/modules/DaliProgrammingStudio/types/command.types';
import type { CompilationResult } from '@/modules/DaliProgrammingStudio/Compiler/CompilationResult';
import type { ApprovedDaliDesign } from '@/modules/DaliProgrammingStudio/types/dali.types';

export interface ProgrammingPlan {
  planId: string;
  designRevisionId: string;
  createdAt: string;
  sequences: DaliCommandSequence[];
  totalCommands: number;
  targetDeviceCount: number;
}

export class ProgrammingPlanBuilder {
  public build(design: ApprovedDaliDesign, orderedSequences: DaliCommandSequence[]): ProgrammingPlan {
    const totalCommands = orderedSequences.reduce((sum, seq) => sum + seq.commands.length, 0);
    
    // Count unique target devices
    const uniqueDevices = new Set<string>();
    for (const seq of orderedSequences) {
      if (seq.targetDeviceId) uniqueDevices.add(seq.targetDeviceId);
    }

    return {
      planId: `plan_${Date.now()}`,
      designRevisionId: design.revisionId,
      createdAt: new Date().toISOString(),
      sequences: orderedSequences,
      totalCommands,
      targetDeviceCount: uniqueDevices.size,
    };
  }
}