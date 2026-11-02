// src/modules/DaliProgrammingStudio/Diagnostics/UnresponsiveDeviceDetector.ts

import type { DiscoveredDevice } from '@/modules/DaliProgrammingStudio/types/addressing.types';
import type { DiagnosticIssue } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';
import { DIAGNOSTIC_SEVERITY } from '@/modules/DaliProgrammingStudio/types/diagnostics.types';
import { DeviceCommunicationTester } from '@/modules/DaliProgrammingStudio/Diagnostics/DeviceCommunicationTester';
import type { IGatewayAdapter } from '@/modules/DaliProgrammingStudio/types/gateway.types';

export class UnresponsiveDeviceDetector {
  private tester: DeviceCommunicationTester;

  constructor(gateway: IGatewayAdapter) {
    this.tester = new DeviceCommunicationTester(gateway);
  }

  public async detect(devices: DiscoveredDevice[]): Promise<DiagnosticIssue[]> {
    const issues: DiagnosticIssue[] = [];

    for (const device of devices) {
      if (device.currentShortAddress !== null) {
        const isResponsive = await this.tester.testCommunication(device.currentShortAddress);
        
        if (!isResponsive) {
          issues.push({
            issueId: `unresponsive_${device.currentShortAddress}`,
            severity: DIAGNOSTIC_SEVERITY.ERROR,
            code: 'UNRESPONSIVE_DEVICE',
            message: `Device at address ${device.currentShortAddress} is not responding to queries.`,
            recommendedAction: 'Device may be faulty or wired incorrectly.',
          });
        }
      }
    }

    return issues;
  }
}