// src/modules/DaliProgrammingStudio/Compiler/ConfigurationNormalizer.ts

import type { DaliDeviceDefinition, DeviceConfigurationParameters } from '@/modules/DaliProgrammingStudio/types/device.types';

export class ConfigurationNormalizer {
  /**
   * Fills in default DALI values for missing parameters so the compiler doesn't
   * generate commands with undefined arguments.
   */
  public normalize(device: DaliDeviceDefinition): DaliDeviceDefinition {
    const defaults: DeviceConfigurationParameters = {
      minLevel: 1,        // DALI physical minimum
      maxLevel: 254,      // DALI physical maximum
      powerOnLevel: 254,  // Default to full brightness on power on
      systemFailureLevel: 0, // Default to off on failure
      fadeTime: 0,        // Instant
      fadeRate: 0,
    };

    return {
      ...device,
      parameters: {
        ...defaults,
        ...device.parameters,
      },
    };
  }
}