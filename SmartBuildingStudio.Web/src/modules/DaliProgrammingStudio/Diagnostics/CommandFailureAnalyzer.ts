// src/modules/DaliProgrammingStudio/Diagnostics/CommandFailureAnalyzer.ts

import type { CommandExecutionResult } from '@/modules/DaliProgrammingStudio/types/command.types';
import type { DiagnosticIssue } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';
import { DIAGNOSTIC_SEVERITY } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';

export class CommandFailureAnalyzer {
  public analyze(result: CommandExecutionResult): DiagnosticIssue | null {
    if (result.status === 'SUCCESS') return null;

    return {
      issueId: `cmd_fail_${result.sequenceId}_${Date.now()}`,
      severity: DIAGNOSTIC_SEVERITY.ERROR,
      code: `COMMAND_${result.status}`,
      message: `Command failed in sequence ${result.sequenceId}: ${result.errorMessage || 'Unknown error'}`,
      recommendedAction: 'Check device connection and gateway logs.',
    };
  }
}