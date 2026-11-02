// src/modules/DaliProgrammingStudio/Configuration/ControlGearConfigurator.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';
import { DeviceParameterConfigurator } from '@/modules/DaliProgrammingStudio/Configuration/DeviceParameterConfigurator';
import { PowerOnConfiguration } from '@/modules/DaliProgrammingStudio/Configuration/PowerOnConfiguration';
import { SystemFailureConfiguration } from '@/modules/DaliProgrammingStudio/Configuration/SystemFailureConfiguration';
import { OperatingModeConfigurator } from '@/modules/DaliProgrammingStudio/Configuration/OperatingModeConfigurator';

export class ControlGearConfigurator {
  private paramConfig = new DeviceParameterConfigurator();
  private powerOnConfig = new PowerOnConfiguration();
  private failureConfig = new SystemFailureConfiguration();
  private modeConfig = new OperatingModeConfigurator();

  public buildCommands(device: DaliDeviceDefinition): DaliCommand[] {
    return [
      ...this.paramConfig.buildCommands(device),
      ...this.powerOnConfig.buildCommands(device),
      ...this.failureConfig.buildCommands(device),
      ...this.modeConfig.buildCommands(device),
    ];
  }
}