// src/modules/DaliProgrammingStudio/Verification/ParameterVerification.ts

import type { VerificationResult } from '@/modules/DaliProgrammingStudio/Verification/VerificationResult';
import { VERIFICATION_CHECK_RESULTS, VERIFICATION_TOLERANCES } from '@/modules/DaliProgrammingStudio/constants/verificationConstants';

export class ParameterVerification {
  public verifyParameter(
    parameter: string,
    expected: number,
    actual: number | undefined,
    deviceId: string
  ): VerificationResult {
    if (actual === undefined) {
      return {
        checkId: `param_${parameter}_${deviceId}`,
        deviceId,
        parameter,
        expectedValue: expected,
        actualValue: undefined,
        result: VERIFICATION_CHECK_RESULTS.NOT_SUPPORTED,
        message: `Device does not support reading parameter ${parameter}`,
      };
    }

    const isMatch = Math.abs(expected - actual) <= VERIFICATION_TOLERANCES.LEVEL_TOLERANCE;

    return {
      checkId: `param_${parameter}_${deviceId}`,
      deviceId,
      parameter,
      expectedValue: expected,
      actualValue: actual,
      result: isMatch ? VERIFICATION_CHECK_RESULTS.PASS : VERIFICATION_CHECK_RESULTS.FAIL,
    };
  }
}