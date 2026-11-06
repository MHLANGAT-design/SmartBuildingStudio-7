// src/modules/DeviceDiscovery/Services/DiscoveryHistoryService.ts

/**
 * History service.
 *
 * Read-only access to past discovery sessions (DiscoveryHistory/ panel).
 * History entries are immutable once completed.
 */

import { DeviceDiscoveryApi } from '@/modules/DeviceDiscovery/Services/DeviceDiscoveryApi';
import type { DiscoverySession } from '@/modules/DeviceDiscovery/Models/DiscoverySession';

export const DiscoveryHistoryService = {
  list(): Promise<DiscoverySession[]> {
    return DeviceDiscoveryApi.getHistory();
  },

  get(sessionId: string): Promise<DiscoverySession> {
    if (!sessionId) throw new Error('A session id is required.');
    return DeviceDiscoveryApi.getHistoryEntry(sessionId);
  },
};