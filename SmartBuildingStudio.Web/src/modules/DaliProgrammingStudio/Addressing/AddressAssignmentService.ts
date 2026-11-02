// src/modules/DaliProgrammingStudio/Addressing/AddressAssignmentService.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { AddressMapping } from '@/modules/DaliProgrammingStudio/Addressing/AddressMapping';
import type { AddressingResult } from '@/modules/DaliProgrammingStudio/Addressing/AddressingResult';
import { ShortAddressAllocator } from '@/modules/DaliProgrammingStudio/Addressing/ShortAddressAllocator';
import { AddressConflictResolver } from '@/modules/DaliProgrammingStudio/Addressing/AddressConflictResolver';
import { AddressingValidator } from '@/modules/DaliProgrammingStudio/Addressing/AddressingValidator';
import { DEFAULT_PROGRAMMING_OPTIONS } from '@/modules/DaliProgrammingStudio/constants/programmingConstants';

export class AddressAssignmentService {
  private allocator = new ShortAddressAllocator();
  private conflictResolver = new AddressConflictResolver();
  private validator = new AddressingValidator();

  public assign(devices: DaliDeviceDefinition[]): AddressingResult {
    const conflicts = this.conflictResolver.detectConflicts(devices);
    if (conflicts.length > 0) {
      return {
        success: false,
        mappings: [],
        conflicts,
        unassignedDevices: devices.map(d => d.deviceId),
        assignedCount: 0,
      };
    }

    const mappings: AddressMapping[] = [];
    const usedAddressesByLine = new Map<string, number[]>();

    for (const device of devices) {
      const lineUsed = usedAddressesByLine.get(device.lineId) || [];
      let assigned = device.hardwareAddress;

      // If the design does not specify an address, auto-allocate one
      if (assigned === undefined || assigned === null) {
        const allocated = this.allocator.allocate(device.lineId, lineUsed);
        if (allocated === null) {
          continue; // Line is full, skip this device
        }
        assigned = allocated;
      }

      mappings.push({
        deviceId: device.deviceId,
        lineId: device.lineId,
        shortAddress: assigned,
      });

      lineUsed.push(assigned);
      usedAddressesByLine.set(device.lineId, lineUsed);
    }

    const validationIssues = this.validator.validate(mappings);
    const unassignedDevices = devices
      .filter(d => !mappings.some(m => m.deviceId === d.deviceId))
      .map(d => d.deviceId);

    return {
      success: validationIssues.length === 0 && unassignedDevices.length === 0,
      mappings,
      conflicts: validationIssues,
      unassignedDevices,
      assignedCount: mappings.length,
    };
  }
}