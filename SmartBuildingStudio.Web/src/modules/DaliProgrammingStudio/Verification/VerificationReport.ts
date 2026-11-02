// src/modules/DaliProgrammingStudio/Verification/VerificationReport.ts

import type { VerificationResult } from '@/modules/DaliProgrammingStudio/Verification/VerificationResult';
import { VERIFICATION_CHECK_RESULTS } from '@/modules/DaliProgrammingStudio/constants/verificationConstants';

export interface VerificationReport {
  reportId: string;
  deploymentId: string;
  timestamp: string;
  results: VerificationResult[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    notSupported: number;
    notTested: number;
  };
  isFullyVerified: boolean;
}

export function buildVerificationReport(deploymentId: string, results: VerificationResult[]): VerificationReport {
  const summary = {
    totalChecks: results.length,
    passed: results.filter(r => r.result === VERIFICATION_CHECK_RESULTS.PASS).length,
    failed: results.filter(r => r.result === VERIFICATION_CHECK_RESULTS.FAIL).length,
    notSupported: results.filter(r => r.result === VERIFICATION_CHECK_RESULTS.NOT_SUPPORTED).length,
    notTested: results.filter(r => r.result === VERIFICATION_CHECK_RESULTS.NOT_TESTED).length,
  };

  return {
    reportId: `rpt_${Date.now()}`,
    deploymentId,
    timestamp: new Date().toISOString(),
    results,
    summary,
    isFullyVerified: summary.failed === 0 && summary.notTested === 0,
  };
}