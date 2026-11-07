// src/modules/GatewayManagement/Services/GatewayIntegrationService.ts

/**
 * Integration service.
 *
 * Read-only access to the GatewayIntegration subsystem's runtime
 * configuration and health. Used by the GatewayIntegration/ components
 * to display whether mock mode is on and whether pings are succeeding.
 */

import { GatewayManagementApi } from '@/modules/GatewayManagement/Services/GatewayManagementApi';

export interface GatewayIntegrationState {
  useMock: boolean;
  healthCheckIntervalSeconds: number;
  maxReconnectAttempts: number;
}

export const GatewayIntegrationService = {
  async getState(): Promise<GatewayIntegrationState> {
    return GatewayManagementApi.getIntegrationState();
  },

  async ping(id: string): Promise<boolean> {
    if (!id) throw new Error('A gateway id is required.');
    return GatewayManagementApi.pingGateway(id);
  },
};