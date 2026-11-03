// src/modules/Commissioning/Engine/DeviceDiscoveryEngine.ts

import type { DeviceState } from '@/modules/Commissioning/models/DeviceState';
import { DeviceService } from '@/modules/Commissioning/services/DeviceService';

export class DeviceDiscoveryEngine {
  /**
   * Orchestrates the discovery process for a given network line.
   */
  public static async discover(gatewayId: string, lineId: string): Promise<DeviceState[]> {
    try {
      const discoveredDevices = await DeviceService.discoverDevices(gatewayId, lineId);
      
      // Filter out any malformed data from the physical layer
      const validDevices = discoveredDevices.filter(d => !!d.deviceId);
      
      if (validDevices.length === 0) {
        throw new Error('No devices found on the network.');
      }

      return validDevices;
    } catch (e: any) {
      throw new Error(`Discovery failed: ${e.message}`);
    }
  }
}