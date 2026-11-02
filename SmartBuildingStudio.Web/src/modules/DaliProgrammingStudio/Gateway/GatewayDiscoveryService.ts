// src/modules/DaliProgrammingStudio/Gateway/GatewayDiscoveryService.ts

import type { GatewayReference } from '@/modules/DaliProgrammingStudio/types/dali.types';

export class GatewayDiscoveryService {
  /**
   * In a real app, this would use UDP broadcast or mDNS to find gateways.
   * For now, it returns a mock list.
   */
  public async discoverGateways(): Promise<GatewayReference[]> {
    return [
      {
        gatewayId: 'mock-gw-001',
        name: 'Mock DALI Gateway (Simulation)',
        manufacturer: 'SmartBuildingStudio',
        protocol: 'DALI-2',
        status: 'ONLINE',
      }
    ];
  }
}