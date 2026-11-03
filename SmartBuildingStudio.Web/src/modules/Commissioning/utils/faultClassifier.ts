// src/modules/Commissioning/utils/faultClassifier.ts

import type { Fault, FaultCategory, FaultSeverity } from '@/modules/Commissioning/models/Fault';

export class FaultClassifier {
  /**
   * Classifies a fault based on its category and the number of devices affected.
   */
  public static classify(
    category: FaultCategory,
    targetId: string,
    description: string,
    affectedDeviceCount: number = 1
  ): Fault {
    let severity: FaultSeverity = 'MINOR';

    switch (category) {
      case 'NETWORK_DROPOUT':
        severity = 'CRITICAL';
        break;
      case 'ADDRESS_CONFLICT':
        severity = affectedDeviceCount > 1 ? 'CRITICAL' : 'MAJOR';
        break;
      case 'NO_RESPONSE':
        severity = affectedDeviceCount > 5 ? 'MAJOR' : 'MINOR';
        break;
      case 'SIGNAL_MISMATCH':
        severity = 'MINOR';
        break;
      case 'SCENE_FAILURE':
        severity = 'MAJOR';
        break;
    }

    return {
      faultId: `fault-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      category,
      severity,
      targetId,
      description,
      detectedAt: new Date().toISOString(),
      isResolved: false,
    };
  }
}