// src/modules/DaliProgrammingStudio/Gateway/GatewayCapabilityResolver.ts

export interface GatewayCapabilities {
  supportsReadBack: boolean;
  supportsD4i: boolean;
  supportsDaliPlus: boolean;
  maxCommandsPerSecond: number;
}

export class GatewayCapabilityResolver {
  private capabilities = new Map<string, GatewayCapabilities>();

  public registerCapabilities(gatewayId: string, caps: GatewayCapabilities): void {
    this.capabilities.set(gatewayId, caps);
  }

  public getCapabilities(gatewayId: string): GatewayCapabilities {
    return this.capabilities.get(gatewayId) || {
      supportsReadBack: false,
      supportsD4i: false,
      supportsDaliPlus: false,
      maxCommandsPerSecond: 10,
    };
  }
}