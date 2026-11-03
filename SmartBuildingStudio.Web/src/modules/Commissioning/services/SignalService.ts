// src/modules/Commissioning/services/SignalService.ts

import { CommissioningApi } from '@/modules/Commissioning/services/CommissioningApi';
import type { SignalLog } from '@/modules/Commissioning/models/SignalLog';

export class SignalService {
  public static async getSignalLogs(deviceId: string): Promise<SignalLog[]> {
    return CommissioningApi.getSignalLogs(deviceId);
  }
}