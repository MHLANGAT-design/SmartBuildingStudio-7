// src/modules/DaliProgrammingStudio/types/dali.types.ts

import type { DaliDeviceDefinition, DaliGroupDefinition, DaliSceneDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';

/**
 * Basic reference to a physical gateway/interface.
 */
export interface GatewayReference {
  gatewayId: string;
  name: string;
  manufacturer: string;
  protocol: 'DALI-2' | 'DALI+' | 'D4i';
  status: 'ONLINE' | 'OFFLINE' | 'CONNECTING';
}

/**
 * A physical DALI line (bus segment).
 */
export interface DaliLine {
  lineId: string;
  name: string;
  gatewayId: string;
  deviceCount: number;
  maxDevices: number;
}

/**
 * Represents the overall topology of the DALI network loaded from DaliDesigner.
 */
export interface DaliTopology {
  projectId: string;
  gateways: GatewayReference[];
  lines: DaliLine[];
  lastUpdated: string;
}

/**
 * The frozen integrated design package from DaliDesigner.
 * This is the root input for the compiler.
 */
export interface ApprovedDaliDesign {
  topology: DaliTopology;
  devices: DaliDeviceDefinition[];
  groups: DaliGroupDefinition[];
  scenes: DaliSceneDefinition[];
  revisionId: string;
  approvedBy: string;
  approvedAt: string;
}