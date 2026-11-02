// src/modules/DaliProgrammingStudio/Compiler/ConfigurationValidator.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { CompilationError } from '@/modules/DaliProgrammingStudio/Compiler/CompilationResult';

export class ConfigurationValidator {
  public validate(devices: DaliDeviceDefinition[]): CompilationError[] {
    const errors: CompilationError[] = [];
    const addressMap = new Map<string, DaliDeviceDefinition[]>(); 

    const unassignedDevices: DaliDeviceDefinition[] = [];

    for (const device of devices) {
      // 1. Check for unassigned addresses (-1)
      if (device.hardwareAddress === -1) {
        unassignedDevices.push(device);
        continue;
      }

      // 2. Check for out-of-range addresses
      if (device.hardwareAddress < 0 || device.hardwareAddress > 63) {
        errors.push({
          code: 'ADDRESS_OUT_OF_RANGE',
          message: `Device "${device.logicalName}" has invalid address ${device.hardwareAddress} (must be 0-63).`,
          deviceId: device.deviceId,
          isFatal: true,
        });
        continue;
      }

      // 3. Group for duplicate checking
      const key = `${device.lineId}-${device.hardwareAddress}`;
      const list = addressMap.get(key) || [];
      list.push(device);
      addressMap.set(key, list);
    }

    // If any devices are unassigned, create ONE summary error with the correct count
    if (unassignedDevices.length > 0) {
      const firstFive = unassignedDevices.slice(0, 5).map(d => `"${d.logicalName}"`).join(', ');
      const remaining = unassignedDevices.length - 5;
      
      errors.push({
        code: 'ADDRESS_UNASSIGNED',
        message: `${unassignedDevices.length} devices have no short address assigned. ${firstFive}${remaining > 0 ? ` and ${remaining} more` : ''}. Please address them in DaliDesigner before compiling.`,
        isFatal: true,
      });
    }

    // 4. Find duplicates
    for (const [key, conflicting] of addressMap.entries()) {
      if (conflicting.length > 1) {
        const lastHyphenIdx = key.lastIndexOf('-');
        const lineId = key.substring(0, lastHyphenIdx);
        const address = key.substring(lastHyphenIdx + 1);
        const names = conflicting.map(d => `"${d.logicalName}"`).join(', ');
        
        errors.push({
          code: 'ADDRESS_CONFLICT',
          message: `Address ${address} on line ${lineId} is assigned to ${conflicting.length} devices: ${names}`,
          isFatal: true,
        });
      }
    }

    return errors;
  }
}