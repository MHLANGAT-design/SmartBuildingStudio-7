// src/modules/DaliProgrammingStudio/types/gateway.types.ts

import type { DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';

/**
 * Configuration required to establish a session with a gateway.
 */
export interface GatewayConnectionConfig {
  gatewayId: string;
  host: string;
  port: number;
  protocol: 'TCP' | 'WEBSOCKET' | 'SERIAL' | 'REST';
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
  };
}

/**
 * The response from a gateway adapter after attempting to send commands.
 */
export interface GatewayResponse {
  success: boolean;
  gatewayId: string;
  timestamp: string;
  responseCode: number;
  payload?: any;
  error?: string;
}

/**
 * The interface that all physical gateway adapters must implement.
 */
export interface IGatewayAdapter {
  connect(config: GatewayConnectionConfig): Promise<boolean>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  sendCommand(command: DaliCommand): Promise<GatewayResponse>;
  sendBatch(commands: DaliCommand[]): Promise<GatewayResponse[]>;
}