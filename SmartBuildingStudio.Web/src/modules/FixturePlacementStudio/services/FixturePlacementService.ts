// src/modules/FixturePlacementStudio/services/FixturePlacementService.ts

import type { FixtureLayout } from '@/modules/FixturePlacementStudio/models/FixtureLayout';
import type { Fixture, FixtureKind } from '@/modules/FixturePlacementStudio/models/Fixture';
import { createFixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import type { EmergencyLight } from '@/modules/FixturePlacementStudio/models/EmergencyLight';
import type { Zone } from '@/modules/FixturePlacementStudio/models/Zone';
import { createZone, addFixtureToZone, removeFixtureFromZone } from '@/modules/FixturePlacementStudio/models/Zone';

// ─── Placement ────────────────────────────────────────────────────────────────

export interface PlaceFixtureArgs {
  kind: FixtureKind;
  productId: string;
  x: number;
  y: number;
  rotation?: number;
  roomId?: string;
  elevation?: number;
  /**
   * Pre-built payload for kind === 'emergencyLight'. Built by
   * buildEmergencyLightFromProduct from the catalog entry's
   * specifications before dispatch. When omitted, createFixture falls
   * back to an empty payload (grey 'E' glyph on the canvas).
   */
  emergencyLight?: EmergencyLight;
}

export function placeFixture(
  layout: FixtureLayout,
  args: PlaceFixtureArgs
): { layout: FixtureLayout; fixture: Fixture } {
  const fixture = createFixture(args.kind, {
    id: `fx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: args.productId,
    documentId: layout.documentId,
    x: args.x,
    y: args.y,
    rotation: args.rotation,
    roomId: args.roomId,
    elevation: args.elevation,
    emergencyLight: args.emergencyLight,
  });

  return {
    layout: { ...layout, fixtures: [...layout.fixtures, fixture], dirty: true },
    fixture,
  };
}

// ─── Move ─────────────────────────────────────────────────────────────────────

export function moveFixtures(
  layout: FixtureLayout,
  fixtureIds: readonly string[],
  deltaX: number,
  deltaY: number
): FixtureLayout {
  const idSet = new Set(fixtureIds);
  return {
    ...layout,
    fixtures: layout.fixtures.map((f) =>
      idSet.has(f.id) ? { ...f, x: f.x + deltaX, y: f.y + deltaY } : f
    ),
    dirty: true,
  };
}

export function setFixturePosition(
  layout: FixtureLayout,
  fixtureId: string,
  x: number,
  y: number
): FixtureLayout {
  return {
    ...layout,
    fixtures: layout.fixtures.map((f) =>
      f.id === fixtureId ? { ...f, x, y } : f
    ),
    dirty: true,
  };
}

/**
 * Move a single fixture to a new position and set its room association.
 *
 * Used by the canvas drag handler, which re-evaluates the room from the
 * drop position with `findRoomAtPoint`. If `roomId` is `undefined`, the
 * fixture's room association is cleared — the fixture has been dragged
 * outside every room.
 *
 * Separate from `setFixturePosition` because the two have different
 * semantics: `setFixturePosition` is a pure geometric move that leaves
 * room membership untouched; this one treats position and room as a
 * single atomic update, which is what a drag-commit means.
 */
export function setFixturePositionAndRoom(
  layout: FixtureLayout,
  fixtureId: string,
  x: number,
  y: number,
  roomId: string | undefined
): FixtureLayout {
  return {
    ...layout,
    fixtures: layout.fixtures.map((f) =>
      f.id === fixtureId ? { ...f, x, y, roomId } : f
    ),
    dirty: true,
  };
}

// ─── Rotate ───────────────────────────────────────────────────────────────────

export function rotateFixtures(
  layout: FixtureLayout,
  fixtureIds: readonly string[],
  radians: number
): FixtureLayout {
  const idSet = new Set(fixtureIds);
  return {
    ...layout,
    fixtures: layout.fixtures.map((f) =>
      idSet.has(f.id) ? { ...f, rotation: f.rotation + radians } : f
    ),
    dirty: true,
  };
}

export function setFixtureRotation(
  layout: FixtureLayout,
  fixtureId: string,
  radians: number
): FixtureLayout {
  return {
    ...layout,
    fixtures: layout.fixtures.map((f) =>
      f.id === fixtureId ? { ...f, rotation: radians } : f
    ),
    dirty: true,
  };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function deleteFixtures(
  layout: FixtureLayout,
  fixtureIds: readonly string[]
): FixtureLayout {
  const idSet = new Set(fixtureIds);
  return {
    ...layout,
    fixtures: layout.fixtures.filter((f) => !idSet.has(f.id)),
    zones: layout.zones.map((z) => ({
      ...z,
      memberFixtureIds: z.memberFixtureIds.filter((fid) => !idSet.has(fid)),
    })),
    selectedFixtureIds: (layout.selectedFixtureIds ?? []).filter(
      (id) => !idSet.has(id)
    ),
    dirty: true,
  };
}

// ─── Duplicate ────────────────────────────────────────────────────────────────

export function duplicateFixtures(
  layout: FixtureLayout,
  fixtureIds: readonly string[]
): { layout: FixtureLayout; newFixtureIds: string[] } {
  const idSet = new Set(fixtureIds);
  const newFixtures: Fixture[] = [];
  const newIds: string[] = [];

  for (const f of layout.fixtures) {
    if (!idSet.has(f.id)) continue;
    const newId = `fx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    newFixtures.push({ ...f, id: newId });
    newIds.push(newId);
  }

  return {
    layout: {
      ...layout,
      fixtures: [...layout.fixtures, ...newFixtures],
      dirty: true,
    },
    newFixtureIds: newIds,
  };
}

// ─── Align ────────────────────────────────────────────────────────────────────

export type AlignAxis = 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY';

export function alignFixtures(
  layout: FixtureLayout,
  fixtureIds: readonly string[],
  axis: AlignAxis
): FixtureLayout {
  const idSet = new Set(fixtureIds);
  const selected = layout.fixtures.filter((f) => idSet.has(f.id));
  if (selected.length < 2) return layout;

  const xs = selected.map((f) => f.x);
  const ys = selected.map((f) => f.y);

  let targetX: number | null = null;
  let targetY: number | null = null;

  switch (axis) {
    case 'left':    targetX = Math.min(...xs); break;
    case 'right':   targetX = Math.max(...xs); break;
    case 'centerX': targetX = (Math.min(...xs) + Math.max(...xs)) / 2; break;
    case 'top':     targetY = Math.max(...ys); break;
    case 'bottom':  targetY = Math.min(...ys); break;
    case 'centerY': targetY = (Math.min(...ys) + Math.max(...ys)) / 2; break;
  }

  return {
    ...layout,
    fixtures: layout.fixtures.map((f) => {
      if (!idSet.has(f.id)) return f;
      return {
        ...f,
        x: targetX != null ? targetX : f.x,
        y: targetY != null ? targetY : f.y,
      };
    }),
    dirty: true,
  };
}

// ─── Distribute ───────────────────────────────────────────────────────────────

export type DistributeAxis = 'horizontal' | 'vertical';

export function distributeFixtures(
  layout: FixtureLayout,
  fixtureIds: readonly string[],
  axis: DistributeAxis
): FixtureLayout {
  const idSet = new Set(fixtureIds);
  const selected = layout.fixtures
    .filter((f) => idSet.has(f.id))
    .slice()
    .sort((a, b) => (axis === 'horizontal' ? a.x - b.x : a.y - b.y));

  if (selected.length < 3) return layout;

  const first = selected[0];
  const last = selected[selected.length - 1];
  const step = axis === 'horizontal'
    ? (last.x - first.x) / (selected.length - 1)
    : (last.y - first.y) / (selected.length - 1);

  const positions = new Map<string, { x: number; y: number }>();
  selected.forEach((f, i) => {
    if (axis === 'horizontal') {
      positions.set(f.id, { x: first.x + step * i, y: f.y });
    } else {
      positions.set(f.id, { x: f.x, y: first.y + step * i });
    }
  });

  return {
    ...layout,
    fixtures: layout.fixtures.map((f) => {
      const p = positions.get(f.id);
      return p ? { ...f, x: p.x, y: p.y } : f;
    }),
    dirty: true,
  };
}

// ─── Zones ────────────────────────────────────────────────────────────────────

export interface CreateZoneArgs {
  name: string;
  kind?: Zone['kind'];
  mode?: Zone['mode'];
  memberFixtureIds?: string[];
  roomIds?: string[];
  targetLux?: number;
}

export function createZoneInLayout(
  layout: FixtureLayout,
  args: CreateZoneArgs
): { layout: FixtureLayout; zone: Zone } {
  const zone = createZone({
    id: `zn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: args.name,
    documentId: layout.documentId,
    kind: args.kind,
    mode: args.mode,
    memberFixtureIds: args.memberFixtureIds,
    roomIds: args.roomIds,
    targetLux: args.targetLux,
  });
  return {
    layout: { ...layout, zones: [...layout.zones, zone], dirty: true },
    zone,
  };
}

export function addFixturesToZone(
  layout: FixtureLayout,
  zoneId: string,
  fixtureIds: readonly string[]
): FixtureLayout {
  return {
    ...layout,
    zones: layout.zones.map((z) => {
      if (z.id !== zoneId) return z;
      let next = z;
      for (const fid of fixtureIds) next = addFixtureToZone(next, fid);
      return next;
    }),
    dirty: true,
  };
}

export function removeFixturesFromZone(
  layout: FixtureLayout,
  zoneId: string,
  fixtureIds: readonly string[]
): FixtureLayout {
  return {
    ...layout,
    zones: layout.zones.map((z) => {
      if (z.id !== zoneId) return z;
      let next = z;
      for (const fid of fixtureIds) next = removeFixtureFromZone(next, fid);
      return next;
    }),
    dirty: true,
  };
}

export function deleteZones(
  layout: FixtureLayout,
  zoneIds: readonly string[]
): FixtureLayout {
  const idSet = new Set(zoneIds);
  return {
    ...layout,
    zones: layout.zones.filter((z) => !idSet.has(z.id)),
    selectedZoneIds: (layout.selectedZoneIds ?? []).filter(
      (id) => !idSet.has(id)
    ),
    dirty: true,
  };
}