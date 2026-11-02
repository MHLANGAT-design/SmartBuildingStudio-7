// src/modules/DaliProgrammingStudio/Gateway/GatewayCommandDispatcher.ts

import type { DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';
import type { GatewayResponse, IGatewayAdapter } from '@/modules/DaliProgrammingStudio/types/gateway.types';
import { DEPLOYMENT_OPTIONS } from '@/modules/DaliProgrammingStudio/constants/deploymentConstants';

export class GatewayCommandDispatcher {
  constructor(private adapter: IGatewayAdapter) {}

  /**
   * Sends a batch of commands with proper pacing to protect the bus.
   */
  public async dispatchBatch(commands: DaliCommand[]): Promise<GatewayResponse[]> {
    const results: GatewayResponse[] = [];

    for (const command of commands) {
      const response = await this.adapter.sendCommand(command);
      results.push(response);

      // Wait to protect the physical DALI bus from overload
      await this.delay(DEPLOYMENT_OPTIONS.INTER_COMMAND_DELAY_MS);
    }

    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}