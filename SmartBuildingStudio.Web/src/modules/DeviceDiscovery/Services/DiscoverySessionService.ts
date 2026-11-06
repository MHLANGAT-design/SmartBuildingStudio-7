// src/modules/DeviceDiscovery/Services/DiscoverySessionService.ts

/**
 * Session lifecycle service.
 *
 * Thin wrapper over DeviceDiscoveryApi for create/start/stop/cancel and reads.
 * The mock bypass lives in DeviceDiscoveryApi; this file exists so the thunk
 * layer has a stable, testable seam per concern.
 */

import { DeviceDiscoveryApi } from '@/modules/DeviceDiscovery/Services/DeviceDiscoveryApi';
import type {
  CreateDiscoverySessionRequest,
} from '@/modules/DeviceDiscovery/Services/DeviceDiscoveryApi';
import type { DiscoverySession } from '@/modules/DeviceDiscovery/Models/DiscoverySession';
import { isSessionStartable, isSessionStoppable } from '@/modules/DeviceDiscovery/Models/DiscoverySession';

export const DiscoverySessionService = {
  async create(req: CreateDiscoverySessionRequest): Promise<DiscoverySession> {
    if (!req.gatewayId) {
      throw new Error('A gateway must be selected before creating a discovery session.');
    }
    return DeviceDiscoveryApi.createSession(req);
  },

  async start(sessionId: string, current: DiscoverySession | null): Promise<DiscoverySession> {
    if (!sessionId) throw new Error('No session to start.');
    if (current && !isSessionStartable(current)) {
      throw new Error(`Cannot start a session in status ${current.status}.`);
    }
    return DeviceDiscoveryApi.startDiscovery({ sessionId });
  },

  async stop(sessionId: string, current: DiscoverySession | null): Promise<DiscoverySession> {
    if (!sessionId) throw new Error('No session to stop.');
    if (current && !isSessionStoppable(current)) {
      throw new Error(`Cannot stop a session in status ${current.status}.`);
    }
    return DeviceDiscoveryApi.stopDiscovery({ sessionId });
  },

  async cancel(sessionId: string): Promise<DiscoverySession> {
    if (!sessionId) throw new Error('No session to cancel.');
    return DeviceDiscoveryApi.cancelDiscovery({ sessionId });
  },

  get(sessionId: string): Promise<DiscoverySession> {
    return DeviceDiscoveryApi.getSession(sessionId);
  },

  list(): Promise<DiscoverySession[]> {
    return DeviceDiscoveryApi.getSessions();
  },
};