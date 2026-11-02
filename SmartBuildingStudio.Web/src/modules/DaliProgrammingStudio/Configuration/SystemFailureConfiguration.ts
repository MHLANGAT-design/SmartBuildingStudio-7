// src/modules/DaliProgrammingStudio/Configuration/SystemFailureConfiguration.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';
import { DaliCommandFactory } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandFactory';
import { DALI_COMMAND_CATEGORIES, DALI_OPCODES } from '@/modules/DaliProgrammingStudio/constants/daliCommandConstants';

export class SystemFailureConfiguration {
  public buildCommands(device: DaliDeviceDefinition): DaliCommand[] {
    if (device.parameters.systemFailureLevel === undefined) {
      return [];
    }

    return [
      DaliCommandFactory.createCommand(
        DALI_COMMAND_CATEGORIES.CONFIGURATION,
        'SHORT_ADDRESS',
        device.hardwareAddress,
        DALI_OPCODES.WRITE_MEMORY_LOCATION,
        device.parameters.systemFailureLevel,
        `Set system failure level to ${device.parameters.systemFailureLevel}`
      )
    ];
  }
}