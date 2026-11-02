// src/modules/DaliProgrammingStudio/Diagnostics/DaliDiagnosticsManager.ts

import type { DiagnosticIssue } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';
import { DIAGNOSTIC_SEVERITY } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';
import type { DiagnosticsReport } from '@/modules/DaliProgrammingStudio/Diagnostics/DiagnosticsReport';
import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DiscoveredDevice } from '@/modules/DaliProgrammingStudio/types/addressing.types';
import type { IGatewayAdapter } from '@/modules/DaliProgrammingStudio/types/gateway.types';
import { AddressConflictDetector } from '@/modules/DaliProgrammingStudio/Diagnostics/AddressConflictDetector';
import { MissingDeviceDetector } from '@/modules/DaliProgrammingStudio/Diagnostics/MissingDeviceDetector';
import { UnresponsiveDeviceDetector } from '@/modules/DaliProgrammingStudio/Diagnostics/UnresponsiveDeviceDetector';
import { BusHealthAnalyzer } from '@/modules/DaliProgrammingStudio/Diagnostics/BusHealthAnalyzer';

export class DaliDiagnosticsManager {
  private conflictDetector = new AddressConflictDetector();
  private missingDetector = new MissingDeviceDetector();
  private unresponsiveDetector: UnresponsiveDeviceDetector;
  private busAnalyzer = new BusHealthAnalyzer();

  constructor(private gateway: IGatewayAdapter) {
    this.unresponsiveDetector = new UnresponsiveDeviceDetector(gateway);
  }

  public async runDiagnostics(
    gatewayId: string,
    lineId: string,
    designDevices: DaliDeviceDefinition[],
    discoveredDevices: DiscoveredDevice[],
    busStats: { successful: number; failed: number; timeouts: number }
  ): Promise<DiagnosticsReport> {
    const issues: DiagnosticIssue[] = [];

    // 1. Address conflicts
    issues.push(...this.conflictDetector.detect(discoveredDevices));

    // 2. Missing devices
    issues.push(...this.missingDetector.detect(designDevices, discoveredDevices));

    // 3. Unresponsive devices
    const unresponsive = await this.unresponsiveDetector.detect(discoveredDevices);
    issues.push(...unresponsive);

    // 4. Bus health
    issues.push(...this.busAnalyzer.analyze(busStats.successful, busStats.failed, busStats.timeouts));

    return this.buildReport(gatewayId, lineId, issues);
  }

  private buildReport(gatewayId: string, lineId: string, issues: DiagnosticIssue[]): DiagnosticsReport {
    return {
      reportId: `diag_${Date.now()}`,
      timestamp: new Date().toISOString(),
      gatewayId,
      lineId,
      issues,
      summary: {
        totalIssues: issues.length,
        critical: issues.filter(i => i.severity === DIAGNOSTIC_SEVERITY.CRITICAL).length,
        errors: issues.filter(i => i.severity === DIAGNOSTIC_SEVERITY.ERROR).length,
        warnings: issues.filter(i => i.severity === DIAGNOSTIC_SEVERITY.WARNING).length,
        info: issues.filter(i => i.severity === DIAGNOSTIC_SEVERITY.INFO).length,
      },
      isHealthy: issues.filter(i => i.severity === DIAGNOSTIC_SEVERITY.CRITICAL || i.severity === DIAGNOSTIC_SEVERITY.ERROR).length === 0,
    };
  }
}