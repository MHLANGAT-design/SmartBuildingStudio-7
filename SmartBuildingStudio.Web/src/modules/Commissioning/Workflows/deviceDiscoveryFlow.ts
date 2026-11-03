// src/modules/Commissioning/Workflows/deviceDiscoveryFlow.ts

import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import { DeviceDiscoveryEngine } from '@/modules/Commissioning/Engine/DeviceDiscoveryEngine';
import { store } from '@/Application/ConfigureStore';

export class DeviceDiscoveryFlow {
  public static async execute(
    session: CommissioningSession,
    gatewayId: string,
    lineId: string,
  ): Promise<CommissioningSession> {
    try {
      const model = (store.getState() as any)?.commissioning?.floorplan ?? null;
      const discoveredDevices = await DeviceDiscoveryEngine.discover(
        gatewayId,
        lineId,
        model,
      );

      // FIX: Start with an empty object instead of spreading existing devices.
      // If this is a fresh discovery for a new plan, spreading would leave
      // old mock devices in the list alongside the newly discovered ones.
      const updatedDeviceStates: Record<string, any> = {};
      for (const dev of discoveredDevices) {
        updatedDeviceStates[dev.deviceId] = dev;
      }

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