// src/modules/DaliProgrammingStudio/types/configuration.types.ts

import type { DeviceConfigurationParameters, DaliGroupAssignment, DaliSceneAssignment } from '@/modules/DaliProgrammingStudio/types/device.types';

/**
 * The expected configuration state of a single device.
 * This is generated from the approved DALI design.
 */
export interface ExpectedDeviceConfiguration {
  deviceId: string;
  shortAddress: number;
  parameters: DeviceConfigurationParameters;
  groups: DaliGroupAssignment[];
  scenes: DaliSceneAssignment[];
}

/**
 * The actual configuration state read back from a physical device.
 */
export interface ActualDeviceConfiguration {
  shortAddress: number;
  parameters: DeviceConfigurationParameters;
  groups: DaliGroupAssignment[];
  scenes: DaliSceneAssignment[];
  readBackErrors: string[];
}

/**
 * A difference found between the expected and actual configuration.
 */
export interface ConfigurationDifference {
  deviceId: string;
  parameter: keyof DeviceConfigurationParameters | 'groups' | 'scenes' | 'address';
  expectedValue: unknown;
  actualValue: unknown;
}

/**
 * A complete snapshot of a device's configuration at a point in time.
 * Used for backups and history comparison.
 */
export interface ConfigurationSnapshot {
  snapshotId: string;
  timestamp: string;
  deviceConfigurations: ExpectedDeviceConfiguration[];
}