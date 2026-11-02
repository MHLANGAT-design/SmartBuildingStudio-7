// src/modules/DaliProgrammingStudio/Configuration/ControlDeviceConfigurator.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';

export class ControlDeviceConfigurator {
  public buildCommands(device: DaliDeviceDefinition): DaliCommand[] {
    // Control devices (sensors, buttons) have unique parameter sets
    // (e.g., occupancy hold time, sensitivity)
    // These would be implemented per DALI Part 103, 303, etc.
    // For now, return empty
    return [];
  }
}