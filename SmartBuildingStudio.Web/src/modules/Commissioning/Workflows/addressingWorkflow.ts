// src/modules/Commissioning/Workflows/addressingWorkflow.ts

import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import type { AddressAssignment } from '@/modules/Commissioning/models/AddressAssignment';
import { AddressingEngine } from '@/modules/Commissioning/Engine/AddressingEngine';

export class AddressingWorkflow {
  /**
   * Auto-addresses all unassigned devices on a line.
   */
  public static async executeAutoAddressing(
    session: CommissioningSession,
    lineId: string
  ): Promise<CommissioningSession> {
    const assignments: AddressAssignment[] = [];
    const updatedDeviceStates = { ...session.deviceStates };
    const currentDevices = Object.values(updatedDeviceStates);

    // Find devices that need addressing
    const unaddressed = currentDevices.filter(AddressingEngine.needsAddressing);

    for (const device of unaddressed) {
      // Find next available slot
      const nextAddr = AddressingEngine.findNextAvailableAddress(lineId, Object.values(updatedDeviceStates));
      
      if (nextAddr === null) {
        console.warn(`[AddressingWorkflow] Line ${lineId} is full. Cannot address more devices.`);
        break;
      }

      // Generate the assignment
      const assignment = AddressingEngine.createAssignment(
        device.deviceId,
        lineId,
        nextAddr,
        device.shortAddress,
        'AUTO'
      );

      // Update device state locally
      updatedDeviceStates[device.deviceId] = {
        ...device,
        shortAddress: nextAddr,
        isAddressed: true,
      };

      assignments.push(assignment);
    }

    // In a full implementation, we would POST 'assignments' to the backend
    // to physically program the devices here.

    return {
      ...session,
      deviceStates: updatedDeviceStates,
      status: 'TESTING',
    };
  }
}