// src/modules/DaliProgrammingStudio/Verification/ConfigurationVerificationManager.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { VerificationReport, DeviceVerificationResult } from '@/modules/DaliProgrammingStudio/Verification/VerificationReport';
import type { IGatewayAdapter } from '@/modules/DaliProgrammingStudio/types/gateway.types';
import { ConfigurationReadBackService } from '@/modules/DaliProgrammingStudio/Verification/ConfigurationReadBackService';
import { buildVerificationReport } from '@/modules/DaliProgrammingStudio/Verification/VerificationReport';
import type { VerificationResult } from '@/modules/DaliProgrammingStudio/Verification/VerificationResult';
import { VERIFICATION_CHECK_RESULTS } from '@/modules/DaliProgrammingStudio/constants/verificationConstants';
import type { VerificationStatus } from '@/modules/DaliProgrammingStudio/constants/programmingConstants';

export class ConfigurationVerificationManager {
  private readBackService: ConfigurationReadBackService;

  constructor(gateway: IGatewayAdapter) {
    this.readBackService = new ConfigurationReadBackService(gateway);
  }

  public async verifyAll(deploymentId: string, devices: DaliDeviceDefinition[]): Promise<VerificationReport> {
    const allResults: VerificationResult[] = [];
    const deviceResults: DeviceVerificationResult[] = [];

    for (const device of devices) {
      const deviceChecks: VerificationResult[] = [];

      try {
        const results = await this.readBackService.verifyDevice(device);
        deviceChecks.push(...results);
        allResults.push(...results);
      } catch (e: any) {
        const errorCheck: VerificationResult = {
          checkId: `readback_err_${device.deviceId}`,
          deviceId: device.deviceId,
          parameter: 'readback',
          expectedValue: 'SUCCESS',
          actualValue: 'ERROR',
          result: 'NOT_TESTED' as any,
          message: e.message || 'Read-back failed',
        };
        deviceChecks.push(errorCheck);
        allResults.push(errorCheck);
      }

      // Compute status for this device
      let status: VerificationStatus = 'MATCHING';
      if (deviceChecks.some(c => c.result === VERIFICATION_CHECK_RESULTS.FAIL)) {
        status = 'INCORRECT';
      } else if (deviceChecks.some(c => c.result === VERIFICATION_CHECK_RESULTS.NOT_TESTED)) {
        status = 'UNVERIFIED';
      } else if (deviceChecks.every(c => c.result === VERIFICATION_CHECK_RESULTS.NOT_SUPPORTED)) {
        status = 'UNSUPPORTED';
      }

      deviceResults.push({
        deviceId: device.deviceId,
        shortAddress: device.hardwareAddress,
        status,
        checks: deviceChecks,
      });
    }

    return buildVerificationReport(deploymentId, allResults, deviceResults);
  }
}