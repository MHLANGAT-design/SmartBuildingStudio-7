// src/modules/DaliProgrammingStudio/Diagnostics/DeviceResponseAnalyzer.ts

import type { DiagnosticIssue } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';
import { DIAGNOSTIC_SEVERITY } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';

export class DeviceResponseAnalyzer {
  public analyzeResponse(deviceId: string, responseCode: number): DiagnosticIssue | null {
    if (responseCode === 0xFF) {
      return {
        issueId: `resp_err_${deviceId}_${Date.now()}`,
        severity: DIAGNOSTIC_SEVERITY.ERROR,
        code: 'DEVICE_NO_RESPONSE',
        message: `Device ${deviceId} responded with 0xFF (No response).`,
        deviceId,
        recommendedAction: 'Check device power and physical connection.',
      };
    }
    
    // Other response codes could be analyzed here
    return null;
  }
}