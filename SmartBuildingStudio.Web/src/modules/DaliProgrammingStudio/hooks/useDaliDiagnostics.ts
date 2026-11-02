// src/modules/DaliProgrammingStudio/hooks/useDaliDiagnostics.ts

import { useCallback, useState } from 'react';
import type { DiagnosticsReport } from '@/modules/DaliProgrammingStudio/Diagnostics/DiagnosticsReport';
import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DiscoveredDevice } from '@/modules/DaliProgrammingStudio/types/addressing.types';
import { DiagnosticsService } from '@/modules/DaliProgrammingStudio/Services/DiagnosticsService';

export function useDaliDiagnostics(service: DiagnosticsService) {
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = useCallback(async (
    gatewayId: string,
    lineId: string,
    designDevices: DaliDeviceDefinition[],
    discoveredDevices: DiscoveredDevice[],
    busStats: { successful: number; failed: number; timeouts: number }
  ) => {
    setIsRunning(true);
    setError(null);
    try {
      const result = await service.runFullScan(gatewayId, lineId, designDevices, discoveredDevices, busStats);
      setReport(result);
      return result;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setIsRunning(false);
    }
  }, [service]);

  return {
    report,
    isRunning,
    error,
    runDiagnostics,
    hasReport: report !== null,
    isHealthy: report?.isHealthy ?? false,
    issueCount: report?.summary.totalIssues ?? 0,
  };
}