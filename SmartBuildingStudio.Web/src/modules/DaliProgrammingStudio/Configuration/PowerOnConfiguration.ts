// src/modules/DaliProgrammingStudio/Configuration/PowerOnConfiguration.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';
import { DaliCommandFactory } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandFactory';
import { DALI_COMMAND_CATEGORIES, DALI_OPCODES } from '@/modules/DaliProgrammingStudio/constants/daliCommandConstants';

export class PowerOnConfiguration {
  public buildCommands(device: DaliDeviceDefinition): DaliCommand[] {
    if (device.parameters.powerOnLevel === undefined) {
      return [];
    }

    return [
      DaliCommandFactory.createCommand(
        DALI_COMMAND_CATEGORIES.CONFIGURATION,
        'SHORT_ADDRESS',
        device.hardwareAddress,
        DALI_OPCODES.WRITE_MEMORY_LOCATION,
        device.parameters.powerOnLevel,
        `Set power-on level to ${device.parameters.powerOnLevel}`
      )
    ];
  }
}