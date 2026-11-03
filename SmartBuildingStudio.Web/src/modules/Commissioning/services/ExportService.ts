// src/modules/Commissioning/services/ExportService.ts

import type { CommissioningReport } from '@/modules/Commissioning/models/CommissioningReport';

export class ExportService {
  /**
   * Downloads the Commissioning Report as a JSON file.
   */
  public static downloadReportAsJson(report: CommissioningReport): void {
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissioning-report-${report.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}