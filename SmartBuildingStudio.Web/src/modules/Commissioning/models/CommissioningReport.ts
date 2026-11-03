// src/modules/Commissioning/models/CommissioningReport.ts

import type { TestResult } from '@/modules/Commissioning/models/TestResult';
import type { Fault } from '@/modules/Commissioning/models/Fault';

export interface CommissioningReport {
  reportId: string;
  sessionId: string;
  projectId: string;
  generatedAt: string;
  totalDevices: number;
  testedDevices: number;
  faults: Fault[];
  testResults: TestResult[];
  overallStatus: 'READY_FOR_HANDOVER' | 'REQUIRES_ATTENTION' | 'CRITICAL_FAILURE';
  signedOffBy?: string;
}