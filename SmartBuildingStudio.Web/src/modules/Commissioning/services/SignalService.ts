// src/modules/Commissioning/services/SignalService.ts

import type { SignalLog } from '@/modules/Commissioning/models/SignalLog';

export class SignalService {
  /**
   * Fetches recent signal logs for a specific device to analyze response times.
   */
  public static async getSignalLogs(deviceId: string): Promise<SignalLog[]> {
    const res = await fetch(`/api/commissioning/devices/${deviceId}/signals`);
    if (!res.ok) throw new Error('Failed to fetch signal logs');
    return res.json();
  }
}