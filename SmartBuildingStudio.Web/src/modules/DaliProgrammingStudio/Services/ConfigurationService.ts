// src/modules/DaliProgrammingStudio/Services/ConfigurationService.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DaliCommandSequence } from '@/modules/DaliProgrammingStudio/types/command.types';
import { DeviceConfigurationManager } from '@/modules/DaliProgrammingStudio/Configuration/DeviceConfigurationManager';

export class ConfigurationService {
  private manager = new DeviceConfigurationManager();

  public buildConfigurationsForDevice(device: DaliDeviceDefinition): DaliCommandSequence[] {
    return this.manager.buildSequences(device);
  }

  public buildConfigurationsForAll(devices: DaliDeviceDefinition[]): DaliCommandSequence[] {
    return devices.flatMap(d => this.manager.buildSequences(d));
  }
}