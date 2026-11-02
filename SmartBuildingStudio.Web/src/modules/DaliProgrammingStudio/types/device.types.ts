// src/modules/DaliProgrammingStudio/types/device.types.ts

import type { DaliDeviceRole, DaliDeviceType, DaliD4iType } from '@/modules/DaliProgrammingStudio/constants/daliDeviceTypes';

/**
 * The expected configuration parameters for a specific device.
 * These are generic properties; specific capabilities dictate which apply.
 */
export interface DeviceConfigurationParameters {
  minLevel?: number;
  maxLevel?: number;
  powerOnLevel?: number;
  systemFailureLevel?: number;
  fadeTime?: number;
  fadeRate?: number;
  operatingMode?: string;
}

/**
 * Group assignment as defined in the design.
 */
export interface DaliGroupAssignment {
  groupId: number;
  name: string;
}

/**
 * Scene assignment and level.
 */
export interface DaliSceneAssignment {
  sceneId: number;
  level: number;
}

/**
 * The complete intended definition of a device as provided by DaliDesigner.
 */
export interface DaliDeviceDefinition {
  deviceId: string;
  lineId: string;
  hardwareAddress: number; // 0-63
  logicalName: string;
  role: DaliDeviceRole;
  deviceType: DaliDeviceType;
  d4iTypes?: DaliD4iType[];
  
  // The expected physical configuration
  groups: DaliGroupAssignment[];
  scenes: DaliSceneAssignment[];
  parameters: DeviceConfigurationParameters;
  
  // Reference back to the fixture placement
  fixtureInstanceId?: string;
}

export interface DaliGroupDefinition {
  groupId: number;
  lineId: string;
  name: string;
}

export interface DaliSceneDefinition {
  sceneId: number;
  lineId: string;
  name: string;
}