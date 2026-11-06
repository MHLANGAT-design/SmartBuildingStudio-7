// src/modules/DeviceDiscovery/Engine/DeviceIdentificationEngine.ts

/**
 * DeviceIdentificationEngine
 *
 * Given a discovered device, produce its DeviceIdentification result.
 *
 * In mock mode it re-derives manufacturer/firmware/capabilities from the same
 * template that generated the device (so identification is consistent across
 * runs). In real mode this engine will call the gateway via GatewayManagement
 * to query the device — the shape returned is identical.
 *
 * Pure function: no timers, no state.
 */

import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';
import type { DeviceIdentification } from '@/modules/DeviceDiscovery/Models/DeviceIdentification';
import { createEmptyIdentification } from '@/modules/DeviceDiscovery/Models/DeviceIdentification';
import { hashSeed, mulberry32 } from '@/modules/DeviceDiscovery/Engine/DeviceDiscoveryEngine';

const FAILURE_RATE = 0.05; // 5% simulated identification failures

export interface IdentifyInput {
  device: DiscoveredDevice;
  /** Injectable clock. */
  now?: () => string;
  /** Force success/failure for deterministic tests. */
  forceOutcome?: 'SUCCEEDED' | 'FAILED' | 'PARTIAL';
}

export const DeviceIdentificationEngine = {
  async identify(input: IdentifyInput): Promise<DeviceIdentification> {
    const now = input.now ?? (() => new Date().toISOString());
    const { device } = input;

    // Realistic async boundary.
    await new Promise(resolve => setTimeout(resolve, 40));

    const rand = mulberry32(hashSeed(`identify:${device.deviceId}`));
    const outcome =
      input.forceOutcome ??
      (rand() < FAILURE_RATE ? 'FAILED' : rand() < 0.1 ? 'PARTIAL' : 'SUCCEEDED');

    if (outcome === 'FAILED') {
      return createEmptyIdentification({
        identificationId: `id-${device.deviceId}`,
        deviceId: device.deviceId,
        sessionId: device.sessionId,
        status: 'FAILED',
        errorMessage: 'Device did not respond to identification query.',
        requestedAt: now(),
        completedAt: now(),
      });
    }

    const capabilities = outcome === 'PARTIAL' ? device.capabilities.slice(0, 1) : device.capabilities;

    return createEmptyIdentification({
      identificationId: `id-${device.deviceId}`,
      deviceId: device.deviceId,
      sessionId: device.sessionId,
      status: outcome,
      manufacturer: device.manufacturer ?? 'Unknown',
      firmwareVersion: device.firmwareVersion ?? null,
      deviceType: device.deviceType ?? null,
      capabilities,
      serialNumber:
        outcome === 'PARTIAL'
          ? null
          : `${device.deviceId.replace(/^dev-/, 'SN').toUpperCase().slice(0, 12)}`,
      gtin: outcome === 'PARTIAL' ? null : `GTIN-${hashSeed(device.deviceId) % 100000000}`,
      requestedAt: now(),
      completedAt: now(),
    });
  },
};