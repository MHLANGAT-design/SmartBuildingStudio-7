// src/modules/DaliProgrammingStudio/Compiler/CapabilityResolver.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import { DeviceCapabilityProfile } from '@/modules/DaliProgrammingStudio/models/DeviceCapabilityProfile';

export class CapabilityResolver {
  /**
   * Checks if a device is capable of executing a specific configuration block.
   */
  public canProgramGroups(device: DaliDeviceDefinition): boolean {
    const profile = new DeviceCapabilityProfile(device);
    return profile.canConfigureGroups();
  }

  public canProgramScenes(device: DaliDeviceDefinition): boolean {
    const profile = new DeviceCapabilityProfile(device);
    return profile.canConfigureScenes();
  }

  public canProgramParameters(device: DaliDeviceDefinition): boolean {
    const profile = new DeviceCapabilityProfile(device);
    return profile.canConfigureMinMax();
  }
}