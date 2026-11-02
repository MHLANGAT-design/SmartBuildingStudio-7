// src/modules/DaliProgrammingStudio/Addressing/AddressConflictResolver.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DiagnosticIssue } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';
import { DIAGNOSTIC_SEVERITY } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';

export class AddressConflictResolver {
  /**
   * Checks if two devices in the design share the same short address on the same line.
   * Returns a list of DiagnosticIssues for every collision found.
   */
  public detectConflicts(devices: DaliDeviceDefinition[]): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const addressMap = new Map<string, DaliDeviceDefinition[]>();

    for (const device of devices) {
      const key = `${device.lineId}:${device.hardwareAddress}`;
      const list = addressMap.get(key) || [];
      list.push(device);
      addressMap.set(key, list);
    }

    for (const [key, conflictingDevices] of addressMap.entries()) {
      if (conflictingDevices.length > 1) {
        const [lineId, address] = key.split(':');
        issues.push({
          issueId: `conflict_${key}`,
          severity: DIAGNOSTIC_SEVERITY.CRITICAL,
          code: 'ADDRESS_COLLISION',
          message: `Line ${lineId} has ${conflictingDevices.length} devices sharing short address ${address}.`,
          recommendedAction: 'Resolve the address assignment in the DaliDesigner before programming.',
        });
      }
    }

    return issues;
  }
}