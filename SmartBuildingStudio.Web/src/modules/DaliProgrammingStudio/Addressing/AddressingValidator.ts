// src/modules/DaliProgrammingStudio/Addressing/AddressingValidator.ts

import type { AddressMapping } from '@/modules/DaliProgrammingStudio/Addressing/AddressMapping';
import type { DiagnosticIssue } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';
import { DIAGNOSTIC_SEVERITY } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';
import { DALI_HARD_LIMITS } from '@/modules/DaliProgrammingStudio/constants/daliConstants';

export class AddressingValidator {
  public validate(mappings: AddressMapping[]): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const usedByLine = new Map<string, Set<number>>();

    for (const mapping of mappings) {
      // Range check
      if (mapping.shortAddress < DALI_HARD_LIMITS.MIN_SHORT_ADDRESS || mapping.shortAddress > DALI_HARD_LIMITS.MAX_SHORT_ADDRESS) {
        issues.push({
          issueId: `range_${mapping.deviceId}`,
          severity: DIAGNOSTIC_SEVERITY.CRITICAL,
          code: 'ADDRESS_OUT_OF_RANGE',
          message: `Device ${mapping.deviceId} has out-of-range short address ${mapping.shortAddress}. Valid range is 0-63.`,
          deviceId: mapping.deviceId,
        });
        continue;
      }

      // Uniqueness check
      const lineAddresses = usedByLine.get(mapping.lineId) || new Set<number>();
      if (lineAddresses.has(mapping.shortAddress)) {
        issues.push({
          issueId: `dup_${mapping.lineId}_${mapping.shortAddress}`,
          severity: DIAGNOSTIC_SEVERITY.CRITICAL,
          code: 'DUPLICATE_ADDRESS',
          message: `Address ${mapping.shortAddress} is assigned to more than one device on line ${mapping.lineId}.`,
          deviceId: mapping.deviceId,
        });
      } else {
        lineAddresses.add(mapping.shortAddress);
        usedByLine.set(mapping.lineId, lineAddresses);
      }
    }

    return issues;
  }
}