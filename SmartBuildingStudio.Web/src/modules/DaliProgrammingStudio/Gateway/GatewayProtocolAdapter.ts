// src/modules/DaliProgrammingStudio/Gateway/GatewayProtocolAdapter.ts

import type { DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';
import type { GatewayResponse, GatewayConnectionConfig } from '@/modules/DaliProgrammingStudio/types/gateway.types';

export abstract class GatewayProtocolAdapter {
  abstract connect(config: GatewayConnectionConfig): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract isConnected(): boolean;
  abstract sendCommand(command: DaliCommand): Promise<GatewayResponse>;
  abstract sendBatch(commands: DaliCommand[]): Promise<GatewayResponse[]>;
}