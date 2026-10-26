// src/modules/FixturePlacementStudio/models/Fixture.ts
//
// Canonical fixture-instance model for FixturePlacementStudio.
//
// A "Fixture" here is a *placed instance* on a specific DrawingDocument.
// It is NOT the product definition — the product lives in
// ProductCatalogService and is referenced by `productId`.
//
// Design notes:
//   - One discriminated-union type covering the 8 device kinds that can
//     be placed on a floor plan. Selection / move / rotate / delete /
//     hit-test all operate on the common envelope; only inspectors and
//     renderers branch on `kind`.
//   - Storage shape: instances are serialized into
//     DrawingDocument.PlacedFixturesJson.electricalFixtures.
//   - `documentId` is stored on every instance so a fixture, once
//     extracted from the document, is self-describing.
//   - Position is world-space (same coordinate system as
//     FloorPlanDesigner). `rotation` is radians, counter-clockwise from
//     +X axis.

import type { Luminaire } from '@/modules/FixturePlacementStudio/models/Luminaire';
import type { Sensor } from '@/modules/FixturePlacementStudio/models/Sensor';
import type { EmergencyLight } from '@/modules/FixturePlacementStudio/models/EmergencyLight';
import type { Driver } from '@/modules/FixturePlacementStudio/models/Driver';
import type { PowerSupply } from '@/modules/FixturePlacementStudio/models/PowerSupply';
import type { Controller } from '@/modules/FixturePlacementStudio/models/Controller';
import type { Gateway } from '@/modules/FixturePlacementStudio/models/Gateway';
import type { Switch } from '@/modules/FixturePlacementStudio/models/Switch';

// ─── Common envelope ──────────────────────────────────────────────────────────

export type FixtureKind =
  // Fixture kinds — things that emit light or are installed as fixtures
  | 'luminaire'
  | 'emergencyLight'
  // Component kinds — parts of a lighting assembly
  | 'driver'
  | 'powerSupply'
  // Control / sensing kinds — network devices and manual controls
  | 'sensor'
  | 'controller'
  | 'gateway'
  | 'switch';

/**
 * Fields common to every placed fixture instance, regardless of kind.
 *
 * These are the fields the placement layer, selection, hit-test, and
 * move/rotate/delete gestures all read or write. Kind-specific data lives
 * in the discriminated branch.
 */
export interface FixtureBase {
  /** Instance id. Unique within the document. */
  id: string;

  /** Discriminator. */
  kind: FixtureKind;

  /**
   * ProductCatalogService productId. Identifies *what this fixture is*.
   * A 5,000-fixture document using 30 products would reference 30 ids.
   */
  productId: string;

  /**
   * The DrawingDocument this instance belongs to. Stored redundantly so
   * a detached fixture (e.g. in a clipboard, undo stack, or selection
   * snapshot) remains self-describing.
   */
  documentId: string;

  /** Optional room association (for lux calculations, zone assignment). */
  roomId?: string;

  /** Optional layer id. Defaults to 'fixtures'. */
  layerId?: string;

  /** World-space X coordinate. */
  x: number;

  /** World-space Y coordinate. */
  y: number;

  /** Rotation in radians, CCW from +X axis. */
  rotation: number;

  /** Elevation above floor in meters. 0 = at floor plane. */
  elevation?: number;

  /**
   * Free-form placement properties that don't fit the typed fields.
   * Preserved through serialization. Used for annotations, tags, or
   * future per-instance metadata that shouldn't require a model change.
   */
  properties?: Record<string, unknown>;
}

// ─── Discriminated union ──────────────────────────────────────────────────────

export type Fixture =
  | (FixtureBase & { kind: 'luminaire';       luminaire:       Luminaire })
  | (FixtureBase & { kind: 'sensor';          sensor:          Sensor })
  | (FixtureBase & { kind: 'emergencyLight';  emergencyLight:  EmergencyLight })
  | (FixtureBase & { kind: 'driver';          driver:          Driver })
  | (FixtureBase & { kind: 'powerSupply';     powerSupply:     PowerSupply })
  | (FixtureBase & { kind: 'controller';      controller:      Controller })
  | (FixtureBase & { kind: 'gateway';         gateway:         Gateway })
  | (FixtureBase & { kind: 'switch';          switch:          Switch });

// ─── Type guards ──────────────────────────────────────────────────────────────

export function isLuminaire(f: Fixture): f is Extract<Fixture, { kind: 'luminaire' }> {
  return f.kind === 'luminaire';
}

export function isSensor(f: Fixture): f is Extract<Fixture, { kind: 'sensor' }> {
  return f.kind === 'sensor';
}

export function isEmergencyLight(f: Fixture): f is Extract<Fixture, { kind: 'emergencyLight' }> {
  return f.kind === 'emergencyLight';
}

export function isDriver(f: Fixture): f is Extract<Fixture, { kind: 'driver' }> {
  return f.kind === 'driver';
}

export function isPowerSupply(f: Fixture): f is Extract<Fixture, { kind: 'powerSupply' }> {
  return f.kind === 'powerSupply';
}

export function isController(f: Fixture): f is Extract<Fixture, { kind: 'controller' }> {
  return f.kind === 'controller';
}

export function isGateway(f: Fixture): f is Extract<Fixture, { kind: 'gateway' }> {
  return f.kind === 'gateway';
}

export function isSwitch(f: Fixture): f is Extract<Fixture, { kind: 'switch' }> {
  return f.kind === 'switch';
}

// ─── Kind sets for classification ─────────────────────────────────────────────

/**
 * Kinds whose primary purpose is emitting light. Used by illuminance
 * calculation — only these contribute to the lux grid.
 */
export const LIGHT_EMITTING_KINDS: readonly FixtureKind[] = [
  'luminaire',
  'emergencyLight',
] as const;

/**
 * Kinds that are components of a luminaire assembly rather than
 * standalone devices. Used by equipment schedules and BOM export.
 */
export const COMPONENT_KINDS: readonly FixtureKind[] = [
  'driver',
  'powerSupply',
] as const;

/**
 * Kinds that sense or control rather than emit. Used by network topology
 * views and control-system exports.
 */
export const CONTROL_KINDS: readonly FixtureKind[] = [
  'sensor',
  'controller',
  'gateway',
  'switch',
] as const;

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create a new fixture instance with sensible defaults.
 *
 * Callers supply `kind`, `productId`, `documentId`, and position; the
 * kind-specific payload is filled with empty defaults and expected to be
 * populated from ProductCatalogService before save.
 */
export function createFixture(
  kind: FixtureKind,
  args: {
    id: string;
    productId: string;
    documentId: string;
    x: number;
    y: number;
    rotation?: number;
    roomId?: string;
    layerId?: string;
    elevation?: number;
    properties?: Record<string, unknown>;
  }
): Fixture {
  const base: FixtureBase = {
    id: args.id,
    kind,
    productId: args.productId,
    documentId: args.documentId,
    roomId: args.roomId,
    layerId: args.layerId ?? 'fixtures',
    x: args.x,
    y: args.y,
    rotation: args.rotation ?? 0,
    elevation: args.elevation ?? 0,
    properties: args.properties ?? {},
  };

  switch (kind) {
    case 'luminaire':
      return { ...base, kind: 'luminaire', luminaire: {} as Luminaire };
    case 'sensor':
      return { ...base, kind: 'sensor', sensor: {} as Sensor };
    case 'emergencyLight':
      return { ...base, kind: 'emergencyLight', emergencyLight: {} as EmergencyLight };
    case 'driver':
      return { ...base, kind: 'driver', driver: {} as Driver };
    case 'powerSupply':
      return { ...base, kind: 'powerSupply', powerSupply: {} as PowerSupply };
    case 'controller':
      return { ...base, kind: 'controller', controller: {} as Controller };
    case 'gateway':
      return { ...base, kind: 'gateway', gateway: {} as Gateway };
    case 'switch':
      return { ...base, kind: 'switch', switch: {} as Switch };
  }
}

// ─── Serialization helpers ────────────────────────────────────────────────────

/**
 * Shape that goes into DrawingDocument.PlacedFixturesJson.electricalFixtures.
 *
 * Kept identical to the in-memory Fixture shape so JSON round-trip is a
 * no-op. If we ever need to trim fields on save, this is the type to
 * change — callers on the wire stay decoupled from the in-memory model.
 */
export type SerializedFixture = Fixture;

export function serializeFixture(f: Fixture): SerializedFixture {
  return f;
}

/** All valid kinds, used by the deserializer to validate incoming data. */
const ALL_KINDS: readonly FixtureKind[] = [
  'luminaire',
  'sensor',
  'emergencyLight',
  'driver',
  'powerSupply',
  'controller',
  'gateway',
  'switch',
] as const;

export function deserializeFixture(raw: any): Fixture | null {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.id !== 'string' || !raw.id) return null;
  if (!ALL_KINDS.includes(raw.kind)) return null;
  if (typeof raw.x !== 'number' || typeof raw.y !== 'number') return null;
  if (typeof raw.rotation !== 'number') return null;

  return {
    ...raw,
    documentId: String(raw.documentId ?? ''),
    productId: String(raw.productId ?? ''),
    layerId: raw.layerId ?? 'fixtures',
    elevation: raw.elevation ?? 0,
    properties: raw.properties ?? {},
  } as Fixture;
}

export default Fixture;