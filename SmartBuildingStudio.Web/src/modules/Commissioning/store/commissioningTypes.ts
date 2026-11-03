// src/modules/Commissioning/store/commissioningTypes.ts

import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import type { CommissioningReport } from '@/modules/Commissioning/models/CommissioningReport';
import type { TestResult } from '@/modules/Commissioning/models/TestResult';
import type { Fault } from '@/modules/Commissioning/models/Fault';

export interface CommissioningState {
  // The active session being worked on
  activeSession: CommissioningSession | null;
  
  // Results from the most recent tests
  recentTestResults: TestResult[];
  
  // The generated report (once complete)
  finalReport: CommissioningReport | null;
  
  // UI state
  isDiscovering: boolean;
  isAddressing: boolean;
  isTesting: boolean;
  isGeneratingReport: boolean;
  
  // Errors
  error: string | null;
}