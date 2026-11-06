// src/modules/DeviceDiscovery/Services/DeviceIdentificationService.ts

/**
 * Identification service.
 *
 * Wraps DeviceDiscoveryApi.identifyDevice. Kept separate so the
 * DeviceIdentification/ components and useDeviceIdentification hook have a
 * focused seam.
 */

import { DeviceDiscoveryApi } from '@/modules/DeviceDiscovery/Services/DeviceDiscoveryApi';
import type { DeviceIdentification } from '@/modules/DeviceDiscovery/Models/DeviceIdentification';

export const DeviceIdentificationService = {
  async identify(sessionId: string, deviceId: string): Promise<DeviceIdentification> {
    if (!sessionId) throw new Error('Identification requires an active session.');
    if (!deviceId) throw new Error('Identification requires a device.');
    return DeviceDiscoveryApi.identifyDevice({ sessionId, deviceId });
  },
};