// src/modules/Commissioning/services/DeviceService.ts

import { CommissioningApi } from '@/modules/Commissioning/services/CommissioningApi';
import type { DeviceState } from '@/modules/Commissioning/models/DeviceState';

export class DeviceService {
  public static async discoverDevices(
    gatewayId: string,
    lineId: string,
  ): Promise<DeviceState[]> {
    return CommissioningApi.discoverDevices(gatewayId, lineId);
  }

  public static async getDeviceState(deviceId: string): Promise<DeviceState> {
    return CommissioningApi.getDeviceState(deviceId);
  }
}