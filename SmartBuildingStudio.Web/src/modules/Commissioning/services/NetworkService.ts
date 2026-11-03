// src/modules/Commissioning/services/NetworkService.ts

import type { NetworkState } from '@/modules/Commissioning/models/NetworkState';

export class NetworkService {
  /**
   * Fetches the current topology and health of a network line.
   */
  public static async getNetworkState(gatewayId: string, lineId: string): Promise<NetworkState> {
    const res = await fetch(`/api/commissioning/networks/${gatewayId}/lines/${lineId}`);
    if (!res.ok) throw new Error('Failed to fetch network state');
    return res.json();
  }

  /**
   * Triggers a physical bus reset (useful for clearing stuck devices).
   */
  public static async resetBus(gatewayId: string, lineId: string): Promise<void> {
    const res = await fetch(`/api/commissioning/networks/${gatewayId}/lines/${lineId}/reset`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Bus reset failed');
  }
}