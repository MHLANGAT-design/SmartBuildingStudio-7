// src/modules/DaliProgrammingStudio/Diagnostics/AddressConflictDetector.ts

import type { DiscoveredDevice } from '@/modules/DaliProgrammingStudio/types/addressing.types';
import type { DiagnosticIssue } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';
import { DIAGNOSTIC_SEVERITY } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';

export class AddressConflictDetector {
  public detect(devices: DiscoveredDevice[]): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const addressMap = new Map<number, number>(); // Address -> count

    for (const device of devices) {
      if (device.currentShortAddress !== null) {
        const count = (addressMap.get(device.currentShortAddress) || 0) + 1;
        addressMap.set(device.currentShortAddress, count);
      }
    }

    for (const [address, count] of addressMap.entries()) {
      if (count > 1) {
        issues.push({
          issueId: `addr_conflict_${address}`,
          severity: DIAGNOSTIC_SEVERITY.CRITICAL,
          code: 'DUPLICATE_SHORT_ADDRESS',
          message: `Duplicate short address detected: ${address} is used by ${count} devices.`,
          recommendedAction: 'Re-address the devices using DALI addressing protocols.',
        });
      }
    }

    return issues;
  }
}