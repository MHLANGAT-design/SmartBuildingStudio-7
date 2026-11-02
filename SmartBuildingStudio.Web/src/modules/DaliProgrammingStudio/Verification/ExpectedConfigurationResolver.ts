// src/modules/DaliProgrammingStudio/Verification/ExpectedConfigurationResolver.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { ExpectedDeviceConfiguration } from '@/modules/DaliProgrammingStudio/types/configuration.types';

export class ExpectedConfigurationResolver {
  public resolve(device: DaliDeviceDefinition): ExpectedDeviceConfiguration {
    return {
      deviceId: device.deviceId,
      shortAddress: device.hardwareAddress,
      parameters: { ...device.parameters },
      groups: [...device.groups],
      scenes: [...device.scenes],
    };
  }
}