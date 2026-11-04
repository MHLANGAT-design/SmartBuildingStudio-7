// src/modules/DaliProgrammingStudio/Services/DiagnosticsService.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DiscoveredDevice } from '@/modules/DaliProgrammingStudio/types/addressing.types';
import type { DiagnosticsReport } from '@/modules/DaliProgrammingStudio/Diagnostics/DiagnosticsReport';
import { CommissioningApi } from '@/modules/Commissioning/services/CommissioningApi';
import { store } from '@/Application/ConfigureStore';

export class DiagnosticsService {
  /**
   * Step 4: Run diagnostics against the physical gateway.
   * The backend handles the bus read-back; the frontend provides the context.
   */
  public async runFullScan(
    gatewayId: string,
    lineId: string,
    designDevices: DaliDeviceDefinition[],
    discoveredDevices: DiscoveredDevice[],
    busStats: { successful: number; failed: number; timeouts: number }
  ): Promise<DiagnosticsReport> {
    const sessionId = (store.getState() as any)?.commissioning?.activeSession?.sessionId;

    if (!sessionId) {
      throw new Error('No active commissioning session. Start one before running diagnostics.');
    }

    const result = await CommissioningApi.runProgrammingDiagnostics(gatewayId, lineId, sessionId);

    // Normalise the backend DTO into the frontend DiagnosticsReport shape.
    // The frontend model may expect additional fields (e.g. `summary`), so we
    // build a complete shape here rather than trusting the raw response.
    return {
      gatewayId: result.gatewayId,
      lineId: result.lineId,
      executedAt: result.executedAt,
      isHealthy: result.isHealthy ?? true,
      busStats: result.busStats ?? { successful: 0, failed: 0, timeouts: 0, successRatePercent: 0 },
      summary: result.summary ?? { totalIssues: 0 },
      deviceStatuses: result.deviceStatuses ?? [],
      globalIssues: result.globalIssues ?? [],
    } as unknown as DiagnosticsReport;
  }
}