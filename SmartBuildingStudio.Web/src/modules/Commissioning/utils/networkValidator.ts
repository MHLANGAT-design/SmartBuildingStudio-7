// src/modules/Commissioning/utils/networkValidator.ts

import type { NetworkState } from '@/modules/Commissioning/models/NetworkState';
import type { Fault } from '@/modules/Commissioning/models/Fault';

export class NetworkValidator {
  /**
   * Verifies the network is in a stable state to begin testing.
   */
  public static canProceedWithTesting(state: NetworkState): { valid: boolean; reason?: string } {
    if (!state.isConnected) {
      return { valid: false, reason: 'Gateway is disconnected.' };
    }
    if (state.totalDevices === 0) {
      return { valid: false, reason: 'No devices discovered on the network.' };
    }
    if (state.onlineDevices < state.totalDevices) {
      return { 
        valid: false, 
        reason: `Only ${state.onlineDevices} of ${state.totalDevices} devices are online.` 
      };
    }
    return { valid: true };
  }

  /**
   * Compares two network states to detect dropouts or degradation.
   */
  public static detectDegradation(previous: NetworkState, current: NetworkState): Fault | null {
    if (current.onlineDevices < previous.onlineDevices) {
      return {
        faultId: `fault-${Date.now()}`,
        category: 'NETWORK_DROPOUT',
        severity: 'MAJOR',
        targetId: current.lineId,
        description: `Network dropout detected. Online devices dropped from ${previous.onlineDevices} to ${current.onlineDevices}.`,
        detectedAt: new Date().toISOString(),
        isResolved: false,
      };
    }
    return null;
  }
}