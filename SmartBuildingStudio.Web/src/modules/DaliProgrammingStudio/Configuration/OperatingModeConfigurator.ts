// src/modules/DaliProgrammingStudio/Configuration/OperatingModeConfigurator.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';

export class OperatingModeConfigurator {
  public buildCommands(device: DaliDeviceDefinition): DaliCommand[] {
    const mode = device.parameters.operatingMode;
    if (!mode) return [];

    // Different modes require different command sequences
    // (e.g., DALI Logarithmic dimming curve vs Linear dimming curve)
    // For now, return empty - real implementation depends on DALI specifications
    return [];
  }
}