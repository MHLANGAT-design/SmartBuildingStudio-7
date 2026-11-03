// src/modules/Commissioning/Engine/SignalVerificationEngine.ts

import type { SignalLog } from '@/modules/Commissioning/models/SignalLog';
import { SignalAnalyzer } from '@/modules/Commissioning/utils/signalAnalyzer';
import type { Fault } from '@/modules/Commissioning/models/Fault';
import { FaultClassifier } from '@/modules/Commissioning/utils/faultClassifier';

export class SignalVerificationEngine {
  /**
   * Verifies the physical signal logs for a set of devices.
   */
  public static verifySignals(logs: SignalLog[]): Fault[] {
    const faults: Fault[] = [];
    
    // Find devices that missed too many responses
    const unresponsiveDevices = SignalAnalyzer.findUnresponsiveDevices(logs);

    for (const deviceId of unresponsiveDevices) {
      faults.push(
        FaultClassifier.classify(
          'NO_RESPONSE',
          deviceId,
          `Device failed to respond to multiple signal queries.`
        )
      );
    }

    return faults;
  }
}