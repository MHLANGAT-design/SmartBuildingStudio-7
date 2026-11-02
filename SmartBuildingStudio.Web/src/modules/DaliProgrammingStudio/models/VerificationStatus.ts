// src/modules/DaliProgrammingStudio/models/VerificationStatus.ts

import { VERIFICATION_CHECK_RESULTS, type VerificationCheckResult } from '@/modules/DaliProgrammingStudio/constants/verificationConstants';

export class DeviceVerificationStatus {
  private checks: Map<string, VerificationCheckResult> = new Map();

  public addCheck(parameter: string, result: VerificationCheckResult): void {
    this.checks.set(parameter, result);
  }

  public getResult(parameter: string): VerificationCheckResult | undefined {
    return this.checks.get(parameter);
  }

  /**
   * Returns true if all checks passed or were not supported.
   * Returns false if any check failed.
   */
  public isOverallPass(): boolean {
    for (const result of this.checks.values()) {
      if (result === VERIFICATION_CHECK_RESULTS.FAIL) {
        return false;
      }
    }
    return true;
  }

  public getFailedChecks(): string[] {
    const failed: string[] = [];
    for (const [param, result] of this.checks.entries()) {
      if (result === VERIFICATION_CHECK_RESULTS.FAIL) {
        failed.push(param);
      }
    }
    return failed;
  }
}