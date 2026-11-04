// src/modules/Commissioning/services/DeviceService.ts

import { API_BASE_URL, USE_MOCK, mockDelay, nowIso } from '@/modules/Commissioning/services/apiConfig';
import type { DeviceState } from '@/modules/Commissioning/models/DeviceState';

export class DeviceService {
  public static async discoverDevices(
    gatewayId: string,
    lineId: string,
    sessionId: string
  ): Promise<DeviceState[]> {
    if (USE_MOCK) {
      await mockDelay(300);
      return [
        { deviceId: `${lineId}-dev-001`, shortAddress: null, connectionStatus: 'ONLINE', lastResponseAt: nowIso(), isAddressed: false } as any,
        { deviceId: `${lineId}-dev-002`, shortAddress: null, connectionStatus: 'ONLINE', lastResponseAt: nowIso(), isAddressed: false } as any,
        { deviceId: `${lineId}-dev-003`, shortAddress: null, connectionStatus: 'ONLINE', lastResponseAt: nowIso(), isAddressed: false } as any,
      ];
    }

    const res = await fetch(`${API_BASE_URL}/api/commissioning/session/${sessionId}/devices/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gatewayId, lineId }),
    });

    if (!res.ok) {
      throw new Error(`Device discovery failed: ${await res.text()}`);
    }

    const dtos = await res.json();
    return dtos.map((d: any) => ({
      deviceId: d.externalId,
      shortAddress: d.shortAddress,
      connectionStatus: d.communicationStatus,
      lastResponseAt: nowIso(),
      isAddressed: d.isAddressed,
      metadata: {
        position: { x: 0, y: 0 },
      }
    }));
  }
}