// src/modules/DaliProgrammingStudio/Diagnostics/DiagnosticsReport.ts

import type { DiagnosticIssue, DiagnosticSeverity } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';

export interface DiagnosticsReport {
  reportId: string;
  timestamp: string;
  gatewayId: string;
  lineId?: string;
  issues: DiagnosticIssue[];
  summary: {
    totalIssues: number;
    critical: number;
    errors: number;
    warnings: number;
    info: number;
  };
  isHealthy: boolean;
}