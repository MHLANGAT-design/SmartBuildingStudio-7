// src/modules/Commissioning/services/TestService.ts

import type { TestResult } from '@/modules/Commissioning/models/TestResult';

export class TestService {
  /**
   * Sends a test signal to a specific device and awaits verification.
   */
  public static async testDeviceSignal(deviceId: string): Promise<TestResult> {
    const res = await fetch(`/api/commissioning/tests/signal/${deviceId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Signal test failed to execute');
    return res.json();
  }

  /**
   * Runs a full network sweep (pings all devices on a line).
   */
  public static async testNetworkLine(gatewayId: string, lineId: string): Promise<TestResult[]> {
    const res = await fetch(`/api/commissioning/tests/network`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gatewayId, lineId }),
    });
    if (!res.ok) throw new Error('Network test failed to execute');
    return res.json();
  }
}