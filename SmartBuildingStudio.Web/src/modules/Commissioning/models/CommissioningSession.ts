// src/modules/Commissioning/models/CommissioningSession.ts

import type { DeviceState } from '@/modules/Commissioning/models/DeviceState';
import type { NetworkState } from '@/modules/Commissioning/models/NetworkState';
import type { Fault } from '@/modules/Commissioning/models/Fault';

export type SessionStatus = 'IDLE' | 'DISCOVERING' | 'ADDRESSING' | 'TESTING' | 'COMPLETED' | 'FAILED';

export interface CommissioningSession {
  sessionId: string;
  projectId: string;
  floorId: string;
  status: SessionStatus;
  startedAt: string;
  completedAt: string | null;
  startedBy: string;
  deviceStates: Record<string, DeviceState>;
  networkStates: Record<string, NetworkState>;
  activeFaults: Fault[];
}