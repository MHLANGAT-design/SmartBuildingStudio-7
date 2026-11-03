// src/modules/Commissioning/Engine/DeviceDiscoveryEngine.ts

import type { DeviceState } from '@/modules/Commissioning/models/DeviceState';
import { DeviceService } from '@/modules/Commissioning/services/DeviceService';
import type { CommissioningFloorplanRenderModel } from '@/modules/Commissioning/Document/CommissioningFloorplanLoader';

function nowIso(): string {
  return new Date().toISOString();
}

function isFixtureElement(el: any): boolean {
  if (!el) return false;
  const t = String(el?.type ?? '').toLowerCase();
  if (t === 'fixture' || t === 'fixtures' || t === 'electricalfixture' || t === 'electricalfixtures') {
    return true;
  }
  if (el.isFixture === true) return true;
  // Fixture elements carry x/y; walls carry startX/endX; rooms carry points.
  // This catches fixtures that only set `kind` (BackendPayloadMapper path).
  if (
    typeof el.kind === 'string' &&
    typeof el.x === 'number' &&
    typeof el.y === 'number' &&
    el.startX === undefined &&
    el.hingeX === undefined &&
    el.isRoom !== true
  ) {
    return true;
  }
  return false;
}

function fixtureToDeviceState(el: any): DeviceState | null {
  const id = String(el?.id ?? el?.Id ?? '');
  if (!id) return null;

  // x/y from the element; fixtures may store them at top level or in points[0]
  const ptsArr = Array.isArray(el.points) ? el.points : Array.isArray(el.vertices) ? el.vertices : [];
  const fromPoints = ptsArr.length > 0 ? ptsArr[0] : null;
  const x = Number(el.x ?? fromPoints?.x);
  const y = Number(el.y ?? fromPoints?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  return {
    deviceId: id,
    shortAddress: null,
    connectionStatus: 'ONLINE',
    lastResponseAt: nowIso(),
    isAddressed: false,
    sourceFixtureId: id,
    metadata: {
      position: { x, y },
      kind: String(el.kind ?? el.fixtureType ?? el.type ?? 'luminaire'),
      productId: el.productId,
      roomId: el.roomId,
    },
  };
}

export class DeviceDiscoveryEngine {
  /**
   * Orchestrates discovery for a network line.
   *
   * Preferred path: read fixtures from the fetched floorplan document
   * (model.elements) and derive one DeviceState per fixture, so the
   * commissioning overlay lands on the actual fixtures on the plan.
   *
   * Fallback: when the plan has no fixture elements (or `model` is null),
   * defer to the physical layer (DeviceService), preserving the previous
   * behaviour for plans without placed fixtures.
   */
  public static async discover(
    gatewayId: string,
    lineId: string,
    model: CommissioningFloorplanRenderModel | null = null,
  ): Promise<DeviceState[]> {
    // ── Preferred path: fixtures from the fetched document ────────────
    if (model && Array.isArray(model.elements)) {
      const fixtures = model.elements.filter(isFixtureElement);
      if (fixtures.length > 0) {
        const devices: DeviceState[] = [];
        for (const el of fixtures) {
          const d = fixtureToDeviceState(el);
          if (d) devices.push(d);
        }
        if (devices.length > 0) {
          return devices;
        }
      }
    }

    // ── Fallback: physical layer (mock or real network) ──────────────
    try {
      const discoveredDevices = await DeviceService.discoverDevices(gatewayId, lineId);
      const validDevices = discoveredDevices.filter((d) => !!d.deviceId);
      if (validDevices.length === 0) {
        throw new Error('No devices found on the network.');
      }
      return validDevices;
    } catch (e: any) {
      throw new Error(`Discovery failed: ${e.message}`);
    }
  }
}