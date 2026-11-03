// src/modules/Commissioning/models/Fault.ts

export type FaultSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING';
export type FaultCategory = 'NO_RESPONSE' | 'SIGNAL_MISMATCH' | 'ADDRESS_CONFLICT' | 'SCENE_FAILURE' | 'NETWORK_DROPOUT';

export interface Fault {
  faultId: string;
  category: FaultCategory;
  severity: FaultSeverity;
  targetId: string; // deviceId, lineId, or sceneId
  description: string;
  detectedAt: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolutionNotes?: string;
}