// src/modules/DaliProgrammingStudio/Services/VerificationService.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { VerificationReport } from '@/modules/DaliProgrammingStudio/Verification/VerificationReport';
import type { IGatewayAdapter } from '@/modules/DaliProgrammingStudio/types/gateway.types';
import { ConfigurationVerificationManager } from '@/modules/DaliProgrammingStudio/Verification/ConfigurationVerificationManager';

export class VerificationService {
  private verificationManager: ConfigurationVerificationManager;

  constructor(gateway: IGatewayAdapter) {
    this.verificationManager = new ConfigurationVerificationManager(gateway);
  }

  public async verifyDeployment(
    deploymentId: string,
    devices: DaliDeviceDefinition[]
  ): Promise<VerificationReport> {
    return this.verificationManager.verifyAll(deploymentId, devices);
  }
}