// src/modules/DaliProgrammingStudio/Commands/DaliCommandFactory.ts

import type { DaliCommand, DaliCommandSequence } from '@/modules/DaliProgrammingStudio/types/command.types';
import { DALI_COMMAND_CATEGORIES, type DaliCommandCategory } from '@/modules/DaliProgrammingStudio/constants/daliCommandConstants';

export class DaliCommandFactory {
  public static createCommand(
    category: DaliCommandCategory,
    targetType: 'SHORT_ADDRESS' | 'GROUP' | 'BROADCAST',
    targetAddress: number,
    opcode: number,
    data: number | undefined,
    description: string
  ): DaliCommand {
    return {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category,
      targetAddress,
      targetType,
      opcode,
      data,
      description,
    };
  }

  public static createSequence(id: string, targetDeviceId: string | undefined, targetGroupId: number | undefined, commands: DaliCommand[], dependencies: string[]): DaliCommandSequence {
    return { id, targetDeviceId, targetGroupId, commands, dependencies };
  }
}