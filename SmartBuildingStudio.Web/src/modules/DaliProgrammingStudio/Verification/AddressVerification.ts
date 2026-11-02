// src/modules/DaliProgrammingStudio/Verification/AddressVerification.ts

import type { VerificationResult } from '@/modules/DaliProgrammingStudio/Verification/VerificationResult';
import { VERIFICATION_CHECK_RESULTS } from '@/modules/DaliProgrammingStudio/constants/verificationConstants';

export class AddressVerification {
  public verifyAddress(expectedAddress: number, actualAddress: number, deviceId: string): VerificationResult {
    return {
      checkId: `verify_addr_${deviceId}`,
      deviceId,
      parameter: 'physical_address',
      expectedValue: expectedAddress,
      actualValue: actualAddress,
      result: expectedAddress === actualAddress ? VERIFICATION_CHECK_RESULTS.PASS : VERIFICATION_CHECK_RESULTS.FAIL,
      message: expectedAddress !== actualAddress ? `Physical address mismatch: expected ${expectedAddress}, got ${actualAddress}` : undefined,
    };
  }
}