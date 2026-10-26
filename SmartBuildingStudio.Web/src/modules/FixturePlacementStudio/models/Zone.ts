// src/modules/FixturePlacementStudio/models/Zone.ts
//
// A lighting zone groups fixtures for control and analysis purposes.
//
// Zones are a FixturePlacementStudio concept — they do not exist in
// FloorPlanDesigner and are not part of the floor-plan geometry model.
// They persist alongside fixtures inside the document's
// PlacedFixturesJson.lightingZones collection.
//
// Design notes:
//   - Zone membership is expressed in BOTH directions for convenience:
//     `memberFixtureIds` on the zone, and `luminaire.lightingGroup` on
//     the fixture. FixturePlacementStudio keeps them in sync; the zone
//     side is authoritative.
//   - Zone geometry is derived, not authored. A zone's effective extent
//     is the union of its fixtures' coverage or the rooms it's assigned
//     to. We do not store a polygon on the zone.

export type ZoneKind =
  | 'open-office'
  | 'corridor'
  | 'emergency'
  | 'task'
  | 'perimeter'
  | 'accent'
  | 'custom';

export type ZoneMode =
  /** All fixtures in the zone are controlled together. */
  | 'unified'
  /** Each fixture retains its own control but is analyzed as a group. */
  | 'grouped'
  /** Fixtures switch together but dim independently. */
  | 'switch-grouped';

export interface Zone {
  /** Zone id. Unique within the document. */
  id: string;

  /** Display name. User-editable. */
  name: string;

  /** Classification driving default rules and rendering. */
  kind: ZoneKind;

  /** Control grouping semantics. */
  mode: ZoneMode;

  /**
   * The document this zone belongs to. Stored redundantly for the same
   * reason as Fixture.documentId — a detached zone remains self-describing.
   */
  documentId: string;

  /**
   * Authoritative list of fixture instance ids in this zone. The
   * corresponding `luminaire.lightingGroup` values on those fixtures
   * are kept in sync by FixturePlacementStudio.
   */
  memberFixtureIds: string[];

  /**
   * Optional rooms this zone is associated with. Multiple rooms can
   * belong to a single zone (e.g. a "circulation" zone spanning several
   * corridors). Room membership is informational — it is not used to
   * derive fixture membership, which is always explicit.
   */
  roomIds?: string[];

  /**
   * Target illuminance in lux, used by validation to check that the
   * zone's fixtures meet specification. Optional — a zone with no target
   * is analyzed for uniformity but not compliance.
   */
  targetLux?: number;

  /**
   * Group identifier shared with the lighting control system (DALI
   * groups, for example). Assigned during export or commissioning.
   * Optional in FixturePlacementStudio.
   */
  controlGroupId?: number;

  /** Free-form per-zone metadata. */
  properties?: Record<string, unknown>;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createZone(args: {
  id: string;
  name: string;
  documentId: string;
  kind?: ZoneKind;
  mode?: ZoneMode;
  memberFixtureIds?: string[];
  roomIds?: string[];
  targetLux?: number;
  controlGroupId?: number;
  properties?: Record<string, unknown>;
}): Zone {
  return {
    id: args.id,
    name: args.name,
    kind: args.kind ?? 'custom',
    mode: args.mode ?? 'grouped',
    documentId: args.documentId,
    memberFixtureIds: args.memberFixtureIds ?? [],
    roomIds: args.roomIds,
    targetLux: args.targetLux,
    controlGroupId: args.controlGroupId,
    properties: args.properties ?? {},
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Add a fixture to a zone. Idempotent — adding an already-present fixture
 * is a no-op. Does NOT modify the fixture side; the caller is responsible
 * for syncing `luminaire.lightingGroup` if it wants the back-reference.
 */
export function addFixtureToZone(zone: Zone, fixtureId: string): Zone {
  if (zone.memberFixtureIds.includes(fixtureId)) return zone;
  return { ...zone, memberFixtureIds: [...zone.memberFixtureIds, fixtureId] };
}

/**
 * Remove a fixture from a zone. Idempotent.
 */
export function removeFixtureFromZone(zone: Zone, fixtureId: string): Zone {
  if (!zone.memberFixtureIds.includes(fixtureId)) return zone;
  return {
    ...zone,
    memberFixtureIds: zone.memberFixtureIds.filter((id) => id !== fixtureId),
  };
}

// ─── Serialization ────────────────────────────────────────────────────────────

/**
 * Shape written into PlacedFixturesJson.lightingZones. Identical to the
 * in-memory Zone, so JSON round-trip is a no-op.
 */
export type SerializedZone = Zone;

export function serializeZone(z: Zone): SerializedZone {
  return z;
}

export function deserializeZone(raw: any): Zone | null {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.id !== 'string' || !raw.id) return null;
  if (typeof raw.name !== 'string') return null;

  return {
    id: raw.id,
    name: raw.name,
    kind: raw.kind ?? 'custom',
    mode: raw.mode ?? 'grouped',
    documentId: String(raw.documentId ?? ''),
    memberFixtureIds: Array.isArray(raw.memberFixtureIds)
      ? raw.memberFixtureIds.map(String)
      : [],
    roomIds: Array.isArray(raw.roomIds) ? raw.roomIds.map(String) : undefined,
    targetLux: typeof raw.targetLux === 'number' ? raw.targetLux : undefined,
    controlGroupId:
      typeof raw.controlGroupId === 'number' ? raw.controlGroupId : undefined,
    properties: raw.properties ?? {},
  };
}

export default Zone;