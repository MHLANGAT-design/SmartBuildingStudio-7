// src/modules/Commissioning/services/NetworkService.ts

import { CommissioningApi } from '@/modules/Commissioning/services/CommissioningApi';
import type { NetworkState } from '@/modules/Commissioning/models/NetworkState';

export class NetworkService {
  public static async getNetworkState(
    gatewayId: string,
    lineId: string,
  ): Promise<NetworkState> {
    return CommissioningApi.getNetworkState(gatewayId, lineId);
  }

  public static async resetBus(gatewayId: string, lineId: string): Promise<void> {
    return CommissioningApi.resetBus(gatewayId, lineId);
  }
}