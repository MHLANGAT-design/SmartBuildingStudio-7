// src/modules/GatewayManagement/Services/GatewayDiagnosticsService.ts

/**
 * Diagnostics service.
 *
 * Wraps the two diagnostics endpoints: fetch the last check result, or
 * run a fresh check. Both return the same shape; the difference is
 * whether the backend executes a ping or just returns the stored value.
 */

import { GatewayManagementApi } from '@/modules/GatewayManagement/Services/GatewayManagementApi';
import type { GatewayDiagnostics } from '@/modules/GatewayManagement/Models/GatewayOperation';

export const GatewayDiagnosticsService = {
  async get(id: string): Promise<GatewayDiagnostics> {
    if (!id) throw new Error('A gateway id is required.');
    return GatewayManagementApi.getDiagnostics(id);
  },

  async run(id: string): Promise<GatewayDiagnostics> {
    if (!id) throw new Error('A gateway id is required.');
    return GatewayManagementApi.runDiagnostics(id, { includeFullChecks: true });
  },
};