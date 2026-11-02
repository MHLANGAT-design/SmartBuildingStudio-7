// src/modules/DaliProgrammingStudio/types/verification.types.ts

import type { VerificationStatus } from '@/modules/DaliProgrammingStudio/constants/programmingConstants';
import type { VerificationCheck } from '@/modules/DaliProgrammingStudio/types/command.types';

export interface DeviceVerificationResult {
  deviceId: string;
  shortAddress: number;
  status: VerificationStatus;
  checks: VerificationCheck[];
  readBackErrors: string[];
}

export interface VerificationReport {
  reportId: string;
  deploymentId: string;
  timestamp: string;
  overallStatus: VerificationStatus;
  deviceResults: DeviceVerificationResult[]; // Added
  results: VerificationCheck[];              // Added (used elsewhere)
  summary: {
    totalDevices: number;
    matchingDevices: number;                 // Added
    failingDevices: number;
    unverifiedDevices: number;
    totalChecks: number;
    passed: number;
    failed: number;
    notSupported: number;
    notTested: number;
  };
  isFullyVerified: boolean;                  // Added (used by selector)
}