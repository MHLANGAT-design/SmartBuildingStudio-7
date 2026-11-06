// src/modules/DeviceDiscovery/Types/DeviceDiscovery.types.ts

export type DiscoverySessionStatus = 'IDLE' | 'DISCOVERING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface DiscoverySession {
  sessionId: string;
  projectId: string;
  floorId: string;
  drawingDocumentId: string;
  gatewayId: string;
  lineId: string;
  status: DiscoverySessionStatus;
  startedAt: string;
  completedAt: string | null;
  discoveredCount: number;
  matchedCount: number;
  exceptionCount: number;
}

export interface DiscoveredDevice {
  deviceId: string;
  shortAddress: number | null;
  randomAddress: string;
  isOnline: boolean;
  capabilities: string[];
  firmwareVersion: string | null;
  manufacturer: string | null;
  identifiedAt: string | null;
  matchedFixtureId: string | null;
  status: 'UNKNOWN' | 'IDENTIFIED' | 'MATCHED' | 'EXCEPTION';
}

export interface DeviceMatch {
  discoveredDeviceId: string;
  expectedFixtureId: string | null;
  matchType: 'EXACT' | 'FUZZY' | 'UNMATCHED';
  confidence: number;
  discrepancyNotes: string | null;
}