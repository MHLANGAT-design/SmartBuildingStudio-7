// src/modules/GatewayManagement/Services/GatewayConnectionService.ts

/**
 * Connection service.
 *
 * Wraps connect/disconnect/reconnect and status/history reads. The
 * connect/reconnect methods do not require the caller to validate the
 * gateway's current state — the domain aggregate enforces the state
 * machine on the server. If the domain throws, the API returns 409 and
 * the thunk surfaces the error string.
 */

import { GatewayManagementApi } from '@/modules/GatewayManagement/Services/GatewayManagementApi';
import type {
  GatewayConnection,
  GatewayStatus,
} from '@/modules/GatewayManagement/Models/GatewayConnection';

export const GatewayConnectionService = {
  async connect(id: string): Promise<void> {
    if (!id) throw new Error('A gateway id is required.');
    await GatewayManagementApi.connect(id);
  },

  async disconnect(id: string, reason?: string | null): Promise<void> {
    if (!id) throw new Error('A gateway id is required.');
    await GatewayManagementApi.disconnect(id, reason ?? null);
  },

  async reconnect(id: string): Promise<void> {
    if (!id) throw new Error('A gateway id is required.');
    await GatewayManagementApi.reconnect(id);
  },

  async getStatus(id: string): Promise<GatewayStatus> {
    if (!id) throw new Error('A gateway id is required.');
    return GatewayManagementApi.getStatus(id);
  },

  async listHistory(id: string): Promise<GatewayConnection[]> {
    if (!id) throw new Error('A gateway id is required.');
    return GatewayManagementApi.listConnections(id);
  },
};