// src/modules/DeviceDiscovery/Engine/DeviceDiscoveryEngine.ts

import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';
import { createEmptyDiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';
import type { DiscoverySessionScope } from '@/modules/DeviceDiscovery/Models/DiscoverySession';
import type { DesignFixture } from '@/modules/DeviceDiscovery/Engine/DeviceMatchingEngine';

export const hashSeed = (input: string): number => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
};

export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const toHex24 = (n: number): string =>
  (n >>> 0).toString(16).toUpperCase().padStart(6, '0');

export interface DiscoveryRunInput {
  sessionId: string;
  gatewayId: string;
  scope: DiscoverySessionScope;
  designFixtures?: DesignFixture[];
  devicesPerLine?: number;
  simulate?: boolean;
  now?: () => string;
}

export interface DiscoveryRunOutput {
  devices: DiscoveredDevice[];
  completedAt: string;
}

const DALI_MAX_DEVICES_PER_LINE = 64;

export const DeviceDiscoveryEngine = {
  async run(input: DiscoveryRunInput): Promise<DiscoveryRunOutput> {
    const now = input.now ?? (() => new Date().toISOString());
    await new Promise(resolve => setTimeout(resolve, 50));

    const simulate = input.simulate !== false;
    if (!simulate) {
      return { devices: [], completedAt: now() };
    }

    const rand = mulberry32(hashSeed(`${input.sessionId}:${input.gatewayId}`));
    const devices: DiscoveredDevice[] = [];
    const activeLineId = input.scope.daliLineIds[0] || 'line-1';

    if (input.designFixtures && input.designFixtures.length > 0) {
      // Only scan fixtures assigned to the currently selected line
      const fixturesOnActiveLine = input.designFixtures.filter(
        f => f.lineId === activeLineId
      );

      // Enforce the DALI limit
      const fixturesToDiscover = fixturesOnActiveLine.slice(0, DALI_MAX_DEVICES_PER_LINE);

      for (let i = 0; i < fixturesToDiscover.length; i++) {
        const fixture = fixturesToDiscover[i];
        const random = Math.floor(rand() * 0xffffff);
        
        devices.push(
          createEmptyDiscoveredDevice({
            deviceId: `dev-${input.sessionId}-${activeLineId}-${devices.length}`,
            sessionId: input.sessionId,
            randomAddress: toHex24(random),
            shortAddress: fixture.expectedShortAddress ?? i,
            daliLineId: activeLineId,
            manufacturer: 'Philips',
            firmwareVersion: '2.1.4',
            deviceType: fixture.expectedDeviceType,
            status: 'UNKNOWN',
            isOnline: true,
            capabilities: fixture.requiredCapabilities,
            discoveredAt: now(),
            lastSeenAt: now(),
          })
        );
      }
    }

    return { devices, completedAt: now() };
  },
};