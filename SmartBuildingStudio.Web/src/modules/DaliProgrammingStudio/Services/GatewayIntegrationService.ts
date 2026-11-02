// src/modules/DaliProgrammingStudio/Services/GatewayIntegrationService.ts

import type { GatewayManager } from '@/modules/DaliProgrammingStudio/Gateway/GatewayManager';
import type { GatewayConnectionConfig } from '@/modules/DaliProgrammingStudio/types/gateway.types';

export class GatewayIntegrationService {
  constructor(private gatewayManager: GatewayManager) {}

  public async connect(gatewayId: string, host: string, port: number): Promise<boolean> {
    const config: GatewayConnectionConfig = {
      gatewayId,
      host,
      port,
      protocol: 'TCP',
    };
    return this.gatewayManager.connect(config);
  }

  public async disconnect(): Promise<void> {
    // Implement disconnect logic
  }

  public startSession(targetLineId: string): void {
    this.gatewayManager.startSession(targetLineId);
  }
}