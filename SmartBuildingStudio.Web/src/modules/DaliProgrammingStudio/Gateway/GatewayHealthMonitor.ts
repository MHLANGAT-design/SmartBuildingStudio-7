// src/modules/DaliProgrammingStudio/Gateway/GatewayHealthMonitor.ts

import type { IGatewayAdapter } from '@/modules/DaliProgrammingStudio/types/gateway.types';

export class GatewayHealthMonitor {
  constructor(private adapter: IGatewayAdapter) {}

  public async checkHealth(): Promise<boolean> {
    if (!this.adapter.isConnected()) {
      return false;
    }

    try {
      // In a real implementation, this might send a DALI Query or a ping
      // For now, we assume if isConnected() returns true, we are good.
      return true;
    } catch {
      return false;
    }
  }
}