// src/modules/Commissioning/services/DeviceService.ts

import type { DeviceState } from '@/modules/Commissioning/models/DeviceState';

export class DeviceService {
  /**
   * Requests the backend to trigger a physical scan on a specific line.
   */
  public static async discoverDevices(gatewayId: string, lineId: string): Promise<DeviceState[]> {
    const res = await fetch(`/api/commissioning/devices/discover?gatewayId=${gatewayId}&lineId=${lineId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Device discovery failed');
    return res.json();
  }

  /**
   * Polls the current physical state of a specific device.
   */
  public static async getDeviceState(deviceId: string): Promise<DeviceState> {
    const res = await fetch(`/api/commissioning/devices/${deviceId}/state`);
    if (!res.ok) throw new Error(`Failed to fetch state for device ${deviceId}`);
    return res.json();
  }
}