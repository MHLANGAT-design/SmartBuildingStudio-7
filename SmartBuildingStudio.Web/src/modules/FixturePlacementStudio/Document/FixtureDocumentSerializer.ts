// src/modules/FixturePlacementStudio/Document/FixtureDocumentSerializer.ts
//
// Converts between the in-memory FixtureLayout and the persisted
// PlacedFixturesJson shape inside the DrawingDocument.
//
// The persisted shape is:
//
//   {
//     importedDrawings: [],
//     electricalFixtures: Fixture[],
//     lightingZones: Zone[]
//   }
//
// The in-memory layout carries that pair PLUS session-only state
// (calculations, selection, dirty flag). The serializer extracts only
// the persistable subset.

import type { FixtureLayout } from '@/modules/FixturePlacementStudio/models/FixtureLayout';
import type { Fixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import { deserializeFixture, serializeFixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import type { Zone } from '@/modules/FixturePlacementStudio/models/Zone';
import { deserializeZone, serializeZone } from '@/modules/FixturePlacementStudio/models/Zone';

// ─── Persisted shape ──────────────────────────────────────────────────────────

/**
 * The shape that goes into DrawingDocument.PlacedFixturesJson. This
 * mirrors the fields FixturePlacementStudio owns; the DrawingDocument
 * round-trips this object untouched.
 */
export interface PersistedPlacedFixtures {
  importedDrawings: unknown[];
  electricalFixtures: unknown[]; // Fixture[]
  lightingZones: unknown[];      // Zone[]
}

// ─── Serialization ────────────────────────────────────────────────────────────

/**
 * Build the payload that goes on the wire when saving. Reads the
 * existing PlacedFixturesJson (preserving any keys we don't own, e.g.
 * importedDrawings) and overlays our fixtures and zones.
 */
export function serializeLayoutForSave(
  layout: FixtureLayout,
  existingPlacedFixtures: any
): PersistedPlacedFixtures {
  const existing = existingPlacedFixtures && typeof existingPlacedFixtures === 'object'
    ? existingPlacedFixtures
    : {};

  return {
    importedDrawings: Array.isArray(existing.importedDrawings)
      ? existing.importedDrawings
      : [],
    electricalFixtures: layout.fixtures.map(serializeFixture),
    lightingZones: layout.zones.map(serializeZone),
  };
}

// ─── Deserialization ──────────────────────────────────────────────────────────

export interface DeserializeResult {
  fixtures: Fixture[];
  zones: Zone[];
  /** Counts of entries that were skipped because they failed validation. */
  droppedFixtures: number;
  droppedZones: number;
}

/**
 * Parse the persisted PlacedFixturesJson into fixtures and zones. Skips
 * malformed entries rather than throwing — a corrupted document should
 * load with whatever valid data it has, not fail wholesale.
 */
export function deserializePlacedFixtures(
  placedFixtures: any
): DeserializeResult {
  const fixtures: Fixture[] = [];
  const zones: Zone[] = [];
  let droppedFixtures = 0;
  let droppedZones = 0;

  const src = placedFixtures && typeof placedFixtures === 'object'
    ? placedFixtures
    : {};

  // Fixtures
  const rawFixtures = Array.isArray(src.electricalFixtures)
    ? src.electricalFixtures
    : [];
  for (const raw of rawFixtures) {
    const fixture = deserializeFixture(raw);
    if (fixture) fixtures.push(fixture);
    else droppedFixtures++;
  }

  // Zones
  const rawZones = Array.isArray(src.lightingZones)
    ? src.lightingZones
    : [];
  for (const raw of rawZones) {
    const zone = deserializeZone(raw);
    if (zone) zones.push(zone);
    else droppedZones++;
  }

  return { fixtures, zones, droppedFixtures, droppedZones };
}

// ─── Diagnostics ──────────────────────────────────────────────────────────────

/**
 * Produce a stable JSON string for a fixture or zone, used when diffing
 * layouts or hashing inputs for calculation invalidation. Property order
 * is normalized so the output is deterministic.
 */
export function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return (
    '{' +
    keys
      .map((k) => JSON.stringify(k) + ':' + stableStringify((obj as any)[k]))
      .join(',') +
    '}'
  );
}

export default {
  serializeLayoutForSave,
  deserializePlacedFixtures,
  stableStringify,
};