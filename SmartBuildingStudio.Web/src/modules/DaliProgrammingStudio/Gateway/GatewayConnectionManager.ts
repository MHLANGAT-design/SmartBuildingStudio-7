// src/modules/DaliProgrammingStudio/Gateway/GatewayConnectionManager.ts

import type { GatewayConnectionConfig } from '@/modules/DaliProgrammingStudio/types/gateway.types';
import type { GatewayProtocolAdapter } from '@/modules/DaliProgrammingStudio/Gateway/GatewayProtocolAdapter';
import { GATEWAY_STATES, type GatewayState } from '@/modules/DaliProgrammingStudio/Gateway/GatewayConnectionState';

export class GatewayConnectionManager {
  private state: GatewayState = GATEWAY_STATES.DISCONNECTED;
  private activeAdapter: GatewayProtocolAdapter | null = null;

  constructor(private adapterFactory: (protocol: string) => GatewayProtocolAdapter) {}

  get currentState(): GatewayState {
    return this.state;
  }

  public async connect(config: GatewayConnectionConfig): Promise<boolean> {
    this.state = GATEWAY_STATES.CONNECTING;
    
    try {
      this.activeAdapter = this.adapterFactory(config.protocol);
      const success = await this.activeAdapter.connect(config);
      
      this.state = success ? GATEWAY_STATES.CONNECTED : GATEWAY_STATES.ERROR;
      return success;
    } catch (e) {
      this.state = GATEWAY_STATES.ERROR;
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.activeAdapter) {
      await this.activeAdapter.disconnect();
    }
    this.state = GATEWAY_STATES.DISCONNECTED;
    this.activeAdapter = null;
  }
}