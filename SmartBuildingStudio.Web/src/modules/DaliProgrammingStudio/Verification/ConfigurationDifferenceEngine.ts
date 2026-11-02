// src/modules/DaliProgrammingStudio/Verification/ConfigurationDifferenceEngine.ts

import type { ExpectedDeviceConfiguration, ActualDeviceConfiguration } from '@/modules/DaliProgrammingStudio/types/configuration.types';
import type { VerificationResult } from '@/modules/DaliProgrammingStudio/Verification/VerificationResult';
import { VERIFICATION_CHECK_RESULTS } from '@/modules/DaliProgrammingStudio/constants/verificationConstants';

export class ConfigurationDifferenceEngine {
  public compare(expected: ExpectedDeviceConfiguration, actual: ActualDeviceConfiguration): VerificationResult[] {
    const results: VerificationResult[] = [];

    // 1. Address Check
    results.push({
      checkId: `addr_${expected.deviceId}`,
      deviceId: expected.deviceId,
      parameter: 'address',
      expectedValue: expected.shortAddress,
      actualValue: actual.shortAddress,
      result: expected.shortAddress === actual.shortAddress ? VERIFICATION_CHECK_RESULTS.PASS : VERIFICATION_CHECK_RESULTS.FAIL,
    });

    // 2. Parameter Checks
    const paramKeys = Object.keys(expected.parameters) as Array<keyof typeof expected.parameters>;
    for (const key of paramKeys) {
      const expVal = expected.parameters[key];
      const actVal = actual.parameters[key];

      if (expVal === undefined) continue;

      results.push({
        checkId: `param_${key}_${expected.deviceId}`,
        deviceId: expected.deviceId,
        parameter: key,
        expectedValue: expVal,
        actualValue: actVal,
        result: expVal === actVal ? VERIFICATION_CHECK_RESULTS.PASS : VERIFICATION_CHECK_RESULTS.FAIL,
      });
    }

    // 3. Group Check
    const expGroups = expected.groups.map(g => g.groupId).sort().join(',');
    const actGroups = actual.groups.map(g => g.groupId).sort().join(',');
    results.push({
      checkId: `groups_${expected.deviceId}`,
      deviceId: expected.deviceId,
      parameter: 'groups',
      expectedValue: expGroups,
      actualValue: actGroups,
      result: expGroups === actGroups ? VERIFICATION_CHECK_RESULTS.PASS : VERIFICATION_CHECK_RESULTS.FAIL,
    });

    return results;
  }
}