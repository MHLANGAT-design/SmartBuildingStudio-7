// src/modules/Commissioning/Engine/AddressingEngine.ts

import type { DeviceState } from '@/modules/Commissioning/models/DeviceState';
import type { AddressAssignment } from '@/modules/Commissioning/models/AddressAssignment';

export class AddressingEngine {
  /**
   * Validates if a device needs an address assignment.
   */
  public static needsAddressing(device: DeviceState): boolean {
    return !device.isAddressed || device.shortAddress === null;
  }

  /**
   * Generates the next available address on a line, ignoring already used ones.
   */
  public static findNextAvailableAddress(
    lineId: string, 
    currentDevices: DeviceState[]
  ): number | null {
    const usedAddresses = new Set(
      currentDevices
        .filter(d => d.shortAddress !== null)
        .map(d => d.shortAddress as number)
    );

    // DALI limit is 0-63
    for (let addr = 0; addr <= 63; addr++) {
      if (!usedAddresses.has(addr)) return addr;
    }

    return null; // Line is full
  }

  /**
   * Creates the assignment payload for the backend.
   */
  public static createAssignment(
    deviceId: string,
    lineId: string,
    newAddress: number,
    previousAddress: number | null,
    method: 'AUTO' | 'MANUAL'
  ): AddressAssignment {
    return {
      deviceId,
      lineId,
      assignedAddress: newAddress,
      previousAddress,
      method,
      assignedAt: new Date().toISOString(),
      assignedBy: 'current-user',
    };
  }
}