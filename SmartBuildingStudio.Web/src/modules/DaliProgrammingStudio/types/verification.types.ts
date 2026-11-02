// src/modules/DaliProgrammingStudio/types/verification.types.ts

import type { VerificationStatus } from '@/modules/DaliProgrammingStudio/constants/programmingConstants';
import type { VerificationCheck } from '@/modules/DaliProgrammingStudio/types/command.types';

/**
 * The result of verifying a single device against its expected configuration.
 */
export interface DeviceVerificationResult {
  deviceId: string;
  shortAddress: number;
  status: VerificationStatus;
  checks: VerificationCheck[];
  readBackErrors: string[];
}

/**
 * The overall verification report for a deployment.
 */
export interface VerificationReport {
  reportId: string;
  deploymentId: string;
  timestamp: string;
  overallStatus: VerificationStatus;
  deviceResults: DeviceVerificationResult[];
  summary: {
    totalDevices: number;
    matchingDevices: number;
    failingDevices: number;
    unverifiedDevices: number;
  };
}