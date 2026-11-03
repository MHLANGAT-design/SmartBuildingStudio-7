// src/modules/Commissioning/services/FaultService.ts

import { CommissioningApi } from '@/modules/Commissioning/services/CommissioningApi';
import type { Fault } from '@/modules/Commissioning/models/Fault';

export class FaultService {
  public static async getActiveFaults(sessionId: string): Promise<Fault[]> {
    return CommissioningApi.getActiveFaults(sessionId);
  }

  public static async resolveFault(faultId: string, notes: string): Promise<Fault> {
    return CommissioningApi.resolveFault(faultId, notes);
  }
}