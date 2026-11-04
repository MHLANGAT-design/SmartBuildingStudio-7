// src/modules/Commissioning/services/TestService.ts

import { CommissioningApi } from '@/modules/Commissioning/services/CommissioningApi';
import type { TestResult } from '@/modules/Commissioning/models/TestResult';

export class TestService {
  public static async testDeviceSignal(
    deviceId: string,
    sessionId: string,
  ): Promise<TestResult> {
    return CommissioningApi.testDeviceSignal(deviceId, sessionId);
  }

  public static async testNetworkLine(
    gatewayId: string,
    lineId: string,
    sessionId: string,
  ): Promise<TestResult[]> {
    return CommissioningApi.testNetworkLine(gatewayId, lineId, sessionId);
  }
}