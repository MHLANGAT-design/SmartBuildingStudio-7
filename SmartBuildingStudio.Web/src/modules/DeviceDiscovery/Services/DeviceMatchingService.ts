// src/modules/DeviceDiscovery/Services/DeviceMatchingService.ts

/**
 * Matching service.
 *
 * Runs the match between discovered devices and the ProjectExplorer design
 * (read-only on ProjectExplorer — matching never mutates design).
 */

import { DeviceDiscoveryApi } from '@/modules/DeviceDiscovery/Services/DeviceDiscoveryApi';
import type { DeviceMatch } from '@/modules/DeviceDiscovery/Models/DeviceMatch';

export const DeviceMatchingService = {
  async match(sessionId: string): Promise<DeviceMatch[]> {
    if (!sessionId) throw new Error('Matching requires an active session.');
    return DeviceDiscoveryApi.matchDiscoveredDevices({ sessionId });
  },

  list(sessionId: string): Promise<DeviceMatch[]> {
    if (!sessionId) throw new Error('Matching requires an active session.');
    return DeviceDiscoveryApi.getMatches(sessionId);
  },
};