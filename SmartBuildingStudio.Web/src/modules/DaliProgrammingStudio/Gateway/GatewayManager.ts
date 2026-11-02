// src/modules/DaliProgrammingStudio/Gateway/GatewayManager.ts

import type { DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';
import type { GatewayConnectionConfig, GatewayResponse, IGatewayAdapter } from '@/modules/DaliProgrammingStudio/types/gateway.types';
import { GatewayConnectionManager } from '@/modules/DaliProgrammingStudio/Gateway/GatewayConnectionManager';
import { GatewayCommandDispatcher } from '@/modules/DaliProgrammingStudio/Gateway/GatewayCommandDispatcher';
import { GatewayHealthMonitor } from '@/modules/DaliProgrammingStudio/Gateway/GatewayHealthMonitor';
import { GatewayCapabilityResolver } from '@/modules/DaliProgrammingStudio/Gateway/GatewayCapabilityResolver';
import { GatewaySession } from '@/modules/DaliProgrammingStudio/Gateway/GatewaySession';
import { GatewayProtocolAdapter } from '@/modules/DaliProgrammingStudio/Gateway/GatewayProtocolAdapter';

export class GatewayManager {
  private connectionManager: GatewayConnectionManager;
  private capabilityResolver: GatewayCapabilityResolver;
  private dispatcher: GatewayCommandDispatcher | null = null;
  private healthMonitor: GatewayHealthMonitor | null = null;
  private activeSession: GatewaySession | null = null;

  constructor(adapterFactory: (protocol: string) => GatewayProtocolAdapter) {
    this.connectionManager = new GatewayConnectionManager(adapterFactory);
    this.capabilityResolver = new GatewayCapabilityResolver();
  }

  public async connect(config: GatewayConnectionConfig): Promise<boolean> {
    const success = await this.connectionManager.connect(config);
    if (success) {
      // In a real scenario, we would retrieve the adapter from the connection manager
      // For simplicity, we cast here, but we would normally pass it through.
      const adapter = (this.connectionManager as any).activeAdapter as IGatewayAdapter;
      this.dispatcher = new GatewayCommandDispatcher(adapter);
      this.healthMonitor = new GatewayHealthMonitor(adapter);
      this.activeSession = new GatewaySession(config.gatewayId, config.protocol);
    }
    return success;
  }

  public startSession(targetLineId: string): void {
    if (!this.activeSession) {
      throw new Error('Must connect to gateway before starting a session.');
    }
    this.activeSession.lockToLine(targetLineId);
  }

  public async sendCommand(command: DaliCommand): Promise<GatewayResponse> {
    if (!this.dispatcher) {
      throw new Error('Dispatcher not initialized. Connect first.');
    }
    return this.dispatcher.dispatchBatch([command]).then(res => res[0]);
  }
}