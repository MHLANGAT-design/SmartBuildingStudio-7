// src/modules/DaliProgrammingStudio/models/DaliGateway.ts

import type { GatewayReference } from '@/modules/DaliProgrammingStudio/types/dali.types';

export class DaliGateway {
  constructor(private readonly data: GatewayReference) {}

  get id(): string { return this.data.gatewayId; }
  get name(): string { return this.data.name; }
  get protocol(): string { return this.data.protocol; }

  public isOnline(): boolean {
    return this.data.status === 'ONLINE';
  }
}