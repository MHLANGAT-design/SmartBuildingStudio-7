// src/modules/DaliProgrammingStudio/Commands/DaliCommandValidator.ts

import type { DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';
import { DALI_HARD_LIMITS } from '@/modules/DaliProgrammingStudio/constants/daliConstants';

export class DaliCommandValidator {
  public validateCommand(command: DaliCommand): { valid: boolean; reason?: string } {
    // Address boundary check
    if (command.targetType === 'SHORT_ADDRESS' && (command.targetAddress < 0 || command.targetAddress > 63)) {
      return { valid: false, reason: `Invalid short address: ${command.targetAddress}` };
    }

    if (command.targetType === 'GROUP' && (command.targetAddress < 0 || command.targetAddress > 15)) {
      return { valid: false, reason: `Invalid group address: ${command.targetAddress}` };
    }

    // Data payload check (DALI data is 8-bit)
    if (command.data !== undefined && (command.data < 0 || command.data > 255)) {
      return { valid: false, reason: `Invalid data payload: ${command.data}. Must be 0-255.` };
    }

    // Ensure opcode is 8-bit
    if (command.opcode < 0 || command.opcode > 255) {
      return { valid: false, reason: `Invalid opcode: ${command.opcode}. Must be 0-255.` };
    }

    return { valid: true };
  }
}