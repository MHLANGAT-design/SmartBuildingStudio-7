// src/modules/DaliProgrammingStudio/Verification/VerificationReport.ts

import type { VerificationResult } from '@/modules/DaliProgrammingStudio/Verification/VerificationResult';
import type { VerificationStatus } from '@/modules/DaliProgrammingStudio/constants/programmingConstants';
import { VERIFICATION_CHECK_RESULTS } from '@/modules/DaliProgrammingStudio/constants/verificationConstants';

export interface DeviceVerificationResult {
  deviceId: string;
  shortAddress: number;
  status: VerificationStatus;
  checks: VerificationResult[];
}

export interface VerificationReport {
  reportId: string;
  deploymentId: string;
  timestamp: string;
  results: VerificationResult[];
  deviceResults: DeviceVerificationResult[];
  summary: {
    totalDevices: number;
    matchingDevices: number;
    failingDevices: number;
    unverifiedDevices: number;
    totalChecks: number;
    passed: number;
    failed: number;
    notSupported: number;
    notTested: number;
  };
  isFullyVerified: boolean;
}

export function buildVerificationReport(
  deploymentId: string, 
  results: VerificationResult[],
  deviceResults: DeviceVerificationResult[] = []
): VerificationReport {
  const summary = {
    totalDevices: deviceResults.length,
    matchingDevices: deviceResults.filter(d => d.status === 'MATCHING').length,
    failingDevices: deviceResults.filter(d => d.status === 'INCORRECT').length,
    unverifiedDevices: deviceResults.filter(d => d.status === 'UNVERIFIED' || d.status === 'UNSUPPORTED').length,
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
    deviceResults,
    summary,
    isFullyVerified: summary.failed === 0 && summary.notTested === 0,
  };
}