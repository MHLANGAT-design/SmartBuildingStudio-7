// src/modules/DaliProgrammingStudio/Services/DiagnosticsService.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DiscoveredDevice } from '@/modules/DaliProgrammingStudio/types/addressing.types';
import type { DiagnosticsReport } from '@/modules/DaliProgrammingStudio/Diagnostics/DiagnosticsReport';
import type { IGatewayAdapter } from '@/modules/DaliProgrammingStudio/types/gateway.types';
import { DaliDiagnosticsManager } from '@/modules/DaliProgrammingStudio/Diagnostics/DaliDiagnosticsManager';

export class DiagnosticsService {
  private diagnosticsManager: DaliDiagnosticsManager;

  constructor(gateway: IGatewayAdapter) {
    this.diagnosticsManager = new DaliDiagnosticsManager(gateway);
  }

  public async runFullScan(
    gatewayId: string,
    lineId: string,
    designDevices: DaliDeviceDefinition[],
    discoveredDevices: DiscoveredDevice[],
    busStats: { successful: number; failed: number; timeouts: number }
  ): Promise<DiagnosticsReport> {
    return this.diagnosticsManager.runDiagnostics(gatewayId, lineId, designDevices, discoveredDevices, busStats);
  }
}