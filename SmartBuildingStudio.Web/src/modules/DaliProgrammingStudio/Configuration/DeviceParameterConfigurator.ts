// src/modules/DaliProgrammingStudio/Configuration/DeviceParameterConfigurator.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';
import { DaliCommandFactory } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandFactory';
import { DALI_COMMAND_CATEGORIES, DALI_OPCODES } from '@/modules/DaliProgrammingStudio/constants/daliCommandConstants';
import { DeviceCapabilityProfile } from '@/modules/DaliProgrammingStudio/models/DeviceCapabilityProfile';

export class DeviceParameterConfigurator {
  public buildCommands(device: DaliDeviceDefinition): DaliCommand[] {
    const commands: DaliCommand[] = [];
    const capabilities = new DeviceCapabilityProfile(device);
    const addr = device.hardwareAddress;
    const params = device.parameters;

    // Safety Rule #4: Capability-aware programming
    if (!capabilities.canConfigureMinMax()) {
      return commands; // Device doesn't support these parameters
    }

    if (params.minLevel !== undefined) {
      commands.push(DaliCommandFactory.createCommand(
        DALI_COMMAND_CATEGORIES.CONFIGURATION,
        'SHORT_ADDRESS',
        addr,
        DALI_OPCODES.WRITE_MEMORY_LOCATION, // Placeholder for DTR0+DTR1+WRITE_MEMORY
        params.minLevel,
        `Set min level to ${params.minLevel}`
      ));
    }

    if (params.maxLevel !== undefined) {
      commands.push(DaliCommandFactory.createCommand(
        DALI_COMMAND_CATEGORIES.CONFIGURATION,
        'SHORT_ADDRESS',
        addr,
        DALI_OPCODES.WRITE_MEMORY_LOCATION,
        params.maxLevel,
        `Set max level to ${params.maxLevel}`
      ));
    }

    return commands;
  }
}