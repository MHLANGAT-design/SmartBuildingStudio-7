// src/modules/Commissioning/Workflows/deviceDiscoveryFlow.ts

import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import type { DeviceState } from '@/modules/Commissioning/models/DeviceState';
import { DeviceDiscoveryEngine } from '@/modules/Commissioning/Engine/DeviceDiscoveryEngine';

export class DeviceDiscoveryFlow {
  /**
   * Executes the full device discovery sequence for a given line.
   */
  public static async execute(
    session: CommissioningSession,
    gatewayId: string,
    lineId: string
  ): Promise<CommissioningSession> {
    try {
      // 1. Trigger physical discovery
      const discoveredDevices = await DeviceDiscoveryEngine.discover(gatewayId, lineId);

      // 2. Merge into session state
      const updatedDeviceStates = { ...session.deviceStates };
      for (const dev of discoveredDevices) {
        updatedDeviceStates[dev.deviceId] = dev;
      }

      // 3. Advance session state
      return {
        ...session,
        deviceStates: updatedDeviceStates,
        status: 'ADDRESSING',
      };
    } catch (e: any) {
      console.error('[DeviceDiscoveryFlow] Failed:', e);
      return {
        ...session,
        status: 'FAILED',
      };
    }
  }
}