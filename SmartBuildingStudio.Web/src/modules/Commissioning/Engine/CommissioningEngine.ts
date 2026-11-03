// src/modules/Commissioning/Engine/CommissioningEngine.ts

import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import type { DeviceState } from '@/modules/Commissioning/models/DeviceState';
import type { Fault } from '@/modules/Commissioning/models/Fault';

import { DeviceDiscoveryEngine } from '@/modules/Commissioning/Engine/DeviceDiscoveryEngine';
import { AddressingEngine } from '@/modules/Commissioning/Engine/AddressingEngine';
import { FaultDetectionEngine } from '@/modules/Commissioning/Engine/FaultDetectionEngine';
import { SignalVerificationEngine } from '@/modules/Commissioning/Engine/SignalVerificationEngine';
import { ConflictResolutionEngine } from '@/modules/Commissioning/Engine/ConflictResolutionEngine';

export class CommissioningEngine {
  /**
   * Step 1: Discovery
   * Updates the session with discovered devices.
   */
  public static async runDiscovery(
    session: CommissioningSession, 
    gatewayId: string, 
    lineId: string
  ): Promise<CommissioningSession> {
    const devices = await DeviceDiscoveryEngine.discover(gatewayId, lineId);
    
    const deviceStates = { ...session.deviceStates };
    for (const dev of devices) {
      deviceStates[dev.deviceId] = dev;
    }

    return {
      ...session,
      deviceStates,
      status: 'ADDRESSING',
    };
  }

  /**
   * Step 2: Addressing Validation
   * Checks for conflicts and updates session faults.
   */
  public static analyzeAddressing(session: CommissioningSession): CommissioningSession {
    const devices = Object.values(session.deviceStates);
    
    // Detect conflicts
    const conflicts = ConflictResolutionEngine.detectAddressConflicts(devices);
    
    // Merge new faults with existing, avoiding duplicates
    const existingFaultIds = new Set(session.activeFaults.map(f => f.faultId));
    const newFaults = conflicts.filter(f => !existingFaultIds.has(f.faultId));

    return {
      ...session,
      activeFaults: [...session.activeFaults, ...newFaults],
    };
  }
}