// src/modules/FixturePlacementStudio/models/FixtureLayout.ts
//
// The runtime working set for a FixturePlacementStudio editing session.
//
// A FixtureLayout is NOT the persisted shape. The persisted shape is the
// pair of arrays inside PlacedFixturesJson:
//
//   {
//     importedDrawings: [],
//     electricalFixtures: Fixture[],
//     lightingZones: Zone[]
//   }
//
// The FixtureLayout carries that pair PLUS the ephemeral state that
// belongs to the session only: derived photometric results, the latest
// validation report, selection, and working flags. None of those persist.
//
// Design notes:
//   - FixtureLayout is the unit the store holds and the DocumentManager
//     reads/writes against. Hooks return it; actions update it.
//   - `revision` mirrors the DrawingDocument revision at load time. It
//     is the value the concurrency check compares on save.
//   - `dirty` is a session concept: has the layout diverged from what
//     was last persisted? The store owns the source of truth, but
//     carrying the flag here means a layout is self-describing when
//     passed around (e.g. to a save dialog).

import type { Fixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import type { Zone } from '@/modules/FixturePlacementStudio/models/Zone';
import type { LightingCalculation } from '@/modules/FixturePlacementStudio/models/LightingCalculation';

// ─── Layout ───────────────────────────────────────────────────────────────────

export interface FixtureLayout {
  /** The DrawingDocument this layout operates on. */
  documentId: string;

  /**
   * Document revision at load time. The save path compares this to the
   * server's current revision; a mismatch means someone else changed the
   * document while we were editing. See FixtureDocumentManager.
   */
  revision: number;

  /**
   * Fixture instances. The authoritative set for this document. Order is
   * not significant; the UI may sort or group by any field.
   */
  fixtures: Fixture[];

  /**
   * Zones. The authoritative set for this document. Zone.memberFixtureIds
   * references Fixture.id, not array indices.
   */
  zones: Zone[];

  // ─── Session-only state (never persisted) ────────────────────────────

  /**
   * Latest calculation records, keyed by kind. There may be multiple
   * historical entries per kind if the user has re-run calculations.
   * The store treats the most recent by `startedAt` as "current" for
   * each kind.
   */
  calculations?: LightingCalculation[];

  /**
   * Selection state. Kept here rather than in a sibling structure so
   * that selection survives a layout being swapped in and out of the
   * store (e.g. switching documents) if we ever want that behaviour.
   * For now, cleared on document change.
   */
  selectedFixtureIds?: string[];
  selectedZoneIds?: string[];

  /**
   * True when fixtures/zones have been modified since the last
   * successful save. Session-only — never written to disk.
   */
  dirty?: boolean;

  /**
   * Free-form per-layout metadata for the session. Not persisted. Useful
   * for stashing UI-only flags (grid visibility, snap mode, etc.) that
   * are scoped to the active layout but don't belong in a global store.
   */
  sessionState?: Record<string, unknown>;
}

// ─── Factories ────────────────────────────────────────────────────────────────

export function createEmptyLayout(args: {
  documentId: string;
  revision: number;
}): FixtureLayout {
  return {
    documentId: args.documentId,
    revision: args.revision,
    fixtures: [],
    zones: [],
    calculations: [],
    selectedFixtureIds: [],
    selectedZoneIds: [],
    dirty: false,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function getFixtureById(
  layout: FixtureLayout,
  fixtureId: string
): Fixture | undefined {
  return layout.fixtures.find((f) => f.id === fixtureId);
}

export function getZoneById(
  layout: FixtureLayout,
  zoneId: string
): Zone | undefined {
  return layout.zones.find((z) => z.id === zoneId);
}

export function getFixturesInZone(
  layout: FixtureLayout,
  zoneId: string
): Fixture[] {
  const zone = getZoneById(layout, zoneId);
  if (!zone) return [];
  const memberSet = new Set(zone.memberFixtureIds);
  return layout.fixtures.filter((f) => memberSet.has(f.id));
}

export function getFixturesInRoom(
  layout: FixtureLayout,
  roomId: string
): Fixture[] {
  return layout.fixtures.filter((f) => f.roomId === roomId);
}

/**
 * The most recent calculation of the given kind, or undefined if none.
 * "Most recent" is determined by `startedAt` (ISO string comparison).
 */
export function getLatestCalculation(
  layout: FixtureLayout,
  kind: LightingCalculation['kind']
): LightingCalculation | undefined {
  if (!layout.calculations || layout.calculations.length === 0) return undefined;
  const matching = layout.calculations.filter((c) => c.kind === kind);
  if (matching.length === 0) return undefined;
  return matching.reduce((latest, c) =>
    c.startedAt > latest.startedAt ? c : latest
  );
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Replace the layout's fixtures with a new set. Returns a new layout
 * (immutable update) with `dirty` set. Callers should use this rather
 * than mutating `fixtures` in place — Redux and React both rely on
 * reference changes to detect updates.
 */
export function setFixtures(
  layout: FixtureLayout,
  fixtures: Fixture[]
): FixtureLayout {
  return { ...layout, fixtures, dirty: true };
}

export function setZones(
  layout: FixtureLayout,
  zones: Zone[]
): FixtureLayout {
  return { ...layout, zones, dirty: true };
}

export function markLayoutClean(layout: FixtureLayout, newRevision: number): FixtureLayout {
  return { ...layout, dirty: false, revision: newRevision };
}

export default FixtureLayout;