// src/modules/DaliProgrammingStudio/Configuration/ConfigurationSnapshot.ts

import type { DeviceConfigurationParameters, DaliGroupAssignment, DaliSceneAssignment } from '@/modules/DaliProgrammingStudio/types/device.types';

export interface ConfigurationSnapshot {
  snapshotId: string;
  deviceId: string;
  timestamp: string;
  parameters: DeviceConfigurationParameters;
  groups: DaliGroupAssignment[];
  scenes: DaliSceneAssignment[];
}

export function createSnapshot(
  deviceId: string,
  parameters: DeviceConfigurationParameters,
  groups: DaliGroupAssignment[],
  scenes: DaliSceneAssignment[]
): ConfigurationSnapshot {
  return {
    snapshotId: `snap_${deviceId}_${Date.now()}`,
    deviceId,
    timestamp: new Date().toISOString(),
    parameters: { ...parameters },
    groups: [...groups],
    scenes: [...scenes],
  };
}