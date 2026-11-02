// src/modules/DaliProgrammingStudio/Verification/VerificationResult.ts

import type { VerificationCheckResult } from '@/modules/DaliProgrammingStudio/constants/verificationConstants';

export interface VerificationResult {
  checkId: string;
  deviceId: string;
  parameter: string;
  expectedValue: unknown;
  actualValue: unknown;
  result: VerificationCheckResult;
  message?: string;
}