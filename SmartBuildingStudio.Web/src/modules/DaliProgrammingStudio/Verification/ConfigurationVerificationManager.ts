// src/modules/DaliProgrammingStudio/Verification/ConfigurationVerificationManager.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { VerificationReport } from '@/modules/DaliProgrammingStudio/Verification/VerificationReport';
import type { IGatewayAdapter } from '@/modules/DaliProgrammingStudio/types/gateway.types';
import { ConfigurationReadBackService } from '@/modules/DaliProgrammingStudio/Verification/ConfigurationReadBackService';
import { buildVerificationReport } from '@/modules/DaliProgrammingStudio/Verification/VerificationReport';
import type { VerificationResult } from '@/modules/DaliProgrammingStudio/Verification/VerificationResult';

export class ConfigurationVerificationManager {
  private readBackService: ConfigurationReadBackService;

  constructor(gateway: IGatewayAdapter) {
    this.readBackService = new ConfigurationReadBackService(gateway);
  }

  public async verifyAll(deploymentId: string, devices: DaliDeviceDefinition[]): Promise<VerificationReport> {
    const allResults: VerificationResult[] = [];

    for (const device of devices) {
      try {
        const results = await this.readBackService.verifyDevice(device);
        allResults.push(...results);
      } catch (e: any) {
        allResults.push({
          checkId: `readback_err_${device.deviceId}`,
          deviceId: device.deviceId,
          parameter: 'readback',
          expectedValue: 'SUCCESS',
          actualValue: 'ERROR',
          result: 'NOT_TESTED' as any,
          message: e.message || 'Read-back failed',
        });
      }
    }

    return buildVerificationReport(deploymentId, allResults);
  }
}