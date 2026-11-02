// src/modules/DaliProgrammingStudio/Diagnostics/MissingDeviceDetector.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DiscoveredDevice } from '@/modules/DaliProgrammingStudio/types/addressing.types';
import type { DiagnosticIssue } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';
import { DIAGNOSTIC_SEVERITY } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';

export class MissingDeviceDetector {
  public detect(designDevices: DaliDeviceDefinition[], discoveredDevices: DiscoveredDevice[]): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const physicalAddresses = new Set(discoveredDevices.map(d => d.currentShortAddress));

    for (const designDevice of designDevices) {
      if (!physicalAddresses.has(designDevice.hardwareAddress)) {
        issues.push({
          issueId: `missing_${designDevice.deviceId}`,
          severity: DIAGNOSTIC_SEVERITY.ERROR,
          code: 'MISSING_DESIGN_DEVICE',
          message: `Device ${designDevice.logicalName} (Address ${designDevice.hardwareAddress}) is in the design but not on the bus.`,
          deviceId: designDevice.deviceId,
          recommendedAction: 'Verify the device is powered and physically connected.',
        });
      }
    }

    return issues;
  }
}