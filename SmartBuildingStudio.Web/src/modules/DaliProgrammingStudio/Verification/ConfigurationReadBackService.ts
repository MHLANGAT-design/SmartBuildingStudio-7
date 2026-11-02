// src/modules/DaliProgrammingStudio/Verification/ConfigurationReadBackService.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { VerificationResult } from '@/modules/DaliProgrammingStudio/Verification/VerificationResult';
import { ExpectedConfigurationResolver } from '@/modules/DaliProgrammingStudio/Verification/ExpectedConfigurationResolver';
import { ActualConfigurationResolver } from '@/modules/DaliProgrammingStudio/Verification/ActualConfigurationResolver';
import { ConfigurationDifferenceEngine } from '@/modules/DaliProgrammingStudio/Verification/ConfigurationDifferenceEngine';
import type { IGatewayAdapter } from '@/modules/DaliProgrammingStudio/types/gateway.types';

export class ConfigurationReadBackService {
  private expectedResolver = new ExpectedConfigurationResolver();
  private differenceEngine = new ConfigurationDifferenceEngine();
  private actualResolver: ActualConfigurationResolver;

  constructor(gateway: IGatewayAdapter) {
    this.actualResolver = new ActualConfigurationResolver(gateway);
  }

  public async verifyDevice(device: DaliDeviceDefinition): Promise<VerificationResult[]> {
    const expected = this.expectedResolver.resolve(device);
    const actual = await this.actualResolver.resolve(device);
    return this.differenceEngine.compare(expected, actual);
  }
}