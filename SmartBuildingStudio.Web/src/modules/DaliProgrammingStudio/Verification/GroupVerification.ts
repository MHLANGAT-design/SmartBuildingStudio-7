// src/modules/DaliProgrammingStudio/Verification/GroupVerification.ts

import type { VerificationResult } from '@/modules/DaliProgrammingStudio/Verification/VerificationResult';
import { VERIFICATION_CHECK_RESULTS } from '@/modules/DaliProgrammingStudio/constants/verificationConstants';

export class GroupVerification {
  public verifyGroups(expectedGroups: number[], actualGroups: number[], deviceId: string): VerificationResult[] {
    const results: VerificationResult[] = [];
    const allGroupIds = new Set([...expectedGroups, ...actualGroups]);

    for (const groupId of allGroupIds) {
      const inExpected = expectedGroups.includes(groupId);
      const inActual = actualGroups.includes(groupId);

      results.push({
        checkId: `group_${groupId}_${deviceId}`,
        deviceId,
        parameter: `group_${groupId}`,
        expectedValue: inExpected,
        actualValue: inActual,
        result: inExpected === inActual ? VERIFICATION_CHECK_RESULTS.PASS : VERIFICATION_CHECK_RESULTS.FAIL,
      });
    }

    return results;
  }
}