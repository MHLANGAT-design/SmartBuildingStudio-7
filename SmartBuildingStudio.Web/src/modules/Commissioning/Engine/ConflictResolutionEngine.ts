// src/modules/Commissioning/Engine/ConflictResolutionEngine.ts

import type { Fault } from '@/modules/Commissioning/models/Fault';
import type { DeviceState } from '@/modules/Commissioning/models/DeviceState';

export class ConflictResolutionEngine {
  /**
   * Detects address conflicts (multiple devices on the same short address).
   */
  public static detectAddressConflicts(devices: DeviceState[]): Fault[] {
    const addressMap = new Map<number, string[]>();

    for (const device of devices) {
      if (device.shortAddress !== null) {
        const existing = addressMap.get(device.shortAddress) || [];
        existing.push(device.deviceId);
        addressMap.set(device.shortAddress, existing);
      }
    }

    const faults: Fault[] = [];
    for (const [address, deviceIds] of addressMap.entries()) {
      if (deviceIds.length > 1) {
        faults.push({
          faultId: `conflict-${address}`,
          category: 'ADDRESS_CONFLICT',
          severity: 'CRITICAL',
          targetId: String(address),
          description: `Address ${address} is assigned to ${deviceIds.length} devices: ${deviceIds.join(', ')}`,
          detectedAt: new Date().toISOString(),
          isResolved: false,
        });
      }
    }

    return faults;
  }
}