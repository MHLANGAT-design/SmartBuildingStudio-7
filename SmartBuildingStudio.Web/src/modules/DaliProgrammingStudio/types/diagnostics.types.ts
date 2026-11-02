// src/modules/DaliProgrammingStudio/types/diagnostics.types.ts

/**
 * Diagnostic warning severity levels.
 */
export const DIAGNOSTIC_SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
} as const;

export type DiagnosticSeverity = typeof DIAGNOSTIC_SEVERITY[keyof typeof DIAGNOSTIC_SEVERITY];

/**
 * A single diagnostic finding on the bus or a device.
 */
export interface DiagnosticIssue {
  issueId: string;
  severity: DiagnosticSeverity;
  code: string;
  message: string;
  deviceId?: string;
  lineId?: string;
  recommendedAction?: string;
}

/**
 * The overall diagnostics report.
 */
export interface DiagnosticsReport {
  reportId: string;
  timestamp: string;
  gatewayId: string;
  lineId?: string;
  issues: DiagnosticIssue[];
  isHealthy: boolean;
}