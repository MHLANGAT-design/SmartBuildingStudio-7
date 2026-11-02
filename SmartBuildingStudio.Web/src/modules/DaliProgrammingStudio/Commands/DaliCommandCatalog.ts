// src/modules/DaliProgrammingStudio/Commands/DaliCommandCatalog.ts

import { DaliCommandFactory } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandFactory';
import { DALI_COMMAND_CATEGORIES, DALI_OPCODES } from '@/modules/DaliProgrammingStudio/constants/daliCommandConstants';

export class DaliCommandCatalog {
  
  public static buildSetMinLevel(targetAddress: number, level: number) {
    return DaliCommandFactory.createCommand(
      DALI_COMMAND_CATEGORIES.CONFIGURATION,
      'SHORT_ADDRESS',
      targetAddress,
      DALI_OPCODES.WRITE_MEMORY_LOCATION, // Using a generic opcode for demonstration
      level,
      `Set min level to ${level}`
    );
  }

  public static buildAddToGroup(targetAddress: number, groupId: number) {
    return DaliCommandFactory.createCommand(
      DALI_COMMAND_CATEGORIES.GROUPING,
      'SHORT_ADDRESS',
      targetAddress,
      DALI_OPCODES.ADD_TO_GROUP + groupId,
      0,
      `Add to group ${groupId}`
    );
  }
}