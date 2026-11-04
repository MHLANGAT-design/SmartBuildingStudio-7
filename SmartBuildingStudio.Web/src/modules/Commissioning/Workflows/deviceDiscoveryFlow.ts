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
      // Retrieve the floorplan from Redux so the engine can map physical fixtures
      const model = (store.getState() as any)?.commissioning?.floorplan ?? null;

      const discoveredDevices = await DeviceDiscoveryEngine.discover(
        gatewayId,
        lineId,
        session.sessionId,
        model // <-- Pass the model so we keep the floorplan mapping logic!
      );

      const updatedDeviceStates = { ...session.deviceStates };
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