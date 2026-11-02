// src/modules/DaliProgrammingStudio/Configuration/GroupConfigurationManager.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';
import { DaliCommandFactory } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandFactory';
import { DALI_COMMAND_CATEGORIES, DALI_OPCODES } from '@/modules/DaliProgrammingStudio/constants/daliCommandConstants';
import { DeviceCapabilityProfile } from '@/modules/DaliProgrammingStudio/models/DeviceCapabilityProfile';

export class GroupConfigurationManager {
  public buildCommands(device: DaliDeviceDefinition): DaliCommand[] {
    const commands: DaliCommand[] = [];
    const capabilities = new DeviceCapabilityProfile(device);

    if (!capabilities.canConfigureGroups()) {
      return commands;
    }

    for (const group of device.groups) {
      commands.push(DaliCommandFactory.createCommand(
        DALI_COMMAND_CATEGORIES.GROUPING,
        'SHORT_ADDRESS',
        device.hardwareAddress,
        DALI_OPCODES.ADD_TO_GROUP + group.groupId,
        0,
        `Add to group ${group.groupId} (${group.name})`
      ));
    }

    return commands;
  }
}