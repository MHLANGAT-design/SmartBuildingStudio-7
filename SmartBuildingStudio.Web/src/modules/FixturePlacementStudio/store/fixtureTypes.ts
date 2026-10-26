// src/modules/FixturePlacementStudio/store/fixtureTypes.ts
//
// Shared types for the FixturePlacementStudio slice, thunks, and selectors.
//
// Design notes:
//   - The Redux state holds ONLY serializable data. The FixtureDocument
//     and FixtureHistory instances (class objects with methods) live in a
//     SessionRegistry singleton keyed by documentId. The slice holds a
//     `documentId` reference so selectors can reach into the registry when
//     they need the class instances.
//   - Action payloads are plain data — same reason.

import type { FixtureLayout } from '@/modules/FixturePlacementStudio/models/FixtureLayout';
import type { Fixture, FixtureKind } from '@/modules/FixturePlacementStudio/models/Fixture';
import type { Zone, ZoneKind, ZoneMode } from '@/modules/FixturePlacementStudio/models/Zone';
import type {
  LightingCalculation,
  CalculationKind,
  CalculationScope,
} from '@/modules/FixturePlacementStudio/models/LightingCalculation';
import type { ValidationReport } from '@/modules/FixturePlacementStudio/services/ValidationService';
import type { PlacementRule } from '@/modules/FixturePlacementStudio/models/PlacementRule';

// ─── Slice state ──────────────────────────────────────────────────────────────

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'conflict' | 'error';

export interface FixtureSliceState {
  /** The document currently loaded into the workspace, if any. */
  documentId: string | null;

  /** The documentId the session was activated with (may differ briefly
   *  during load). Kept so we can display breadcrumbs before the
   *  DrawingDocument is ready. */
  activationContext: {
    projectId: string;
    buildingId: string;
    floorId: string;
    documentId: string;
    revision: number;
  } | null;

  /** Load lifecycle. */
  loadStatus: LoadStatus;
  loadError: string | null;

  /** Save lifecycle. */
  saveStatus: SaveStatus;
  saveError: string | null;
  /** When saveStatus === 'conflict', the server/client revisions. */
  conflict: { serverRevision: number; clientRevision: number } | null;

  /** The runtime working set. Null until load succeeds. */
  layout: FixtureLayout | null;

  /** Selection. Fixtures and zones. */
  selectedFixtureIds: string[];
  selectedZoneIds: string[];

  /** Latest calculation records. Keyed by kind for O(1) lookup of
   *  current-per-kind; historical entries kept in `calculationsHistory`. */
  calculations: Record<CalculationKind, LightingCalculation | null>;
  calculationsHistory: LightingCalculation[];
  /** Calculation currently running, if any. */
  runningCalculation: CalculationKind | null;

  /** Latest validation report. Null until validate() runs. */
  validationReport: ValidationReport | null;
  /** True while validate() is running. */
  validating: boolean;

  /** The active rule set. Replaced via loadRuleSet. */
  ruleSet: { id: string; name: string; rules: PlacementRule[] } | null;

  /** Dirty flag — mirrors layout.dirty for convenience, and survives
   *  layout being nulled during a save round-trip. */
  dirty: boolean;
}

// ─── Action payloads ──────────────────────────────────────────────────────────

export interface BeginLoadPayload {
  activationContext: FixtureSliceState['activationContext'];
}

export interface LoadSucceededPayload {
  documentId: string;
  layout: FixtureLayout;
}

export interface LoadFailedPayload {
  error: string;
}

export interface SetLayoutPayload {
  layout: FixtureLayout;
}

export interface PlaceFixturePayload {
  kind: FixtureKind;
  productId: string;
  x: number;
  y: number;
  rotation?: number;
  roomId?: string;
  elevation?: number;
}

export interface MoveFixturesPayload {
  fixtureIds: string[];
  deltaX: number;
  deltaY: number;
}

export interface RotateFixturesPayload {
  fixtureIds: string[];
  radians: number;
}

export interface DeleteFixturesPayload {
  fixtureIds: string[];
}

/**
 * Payload for the mergeFixtures reducer. Emitted by importFixturesThunk
 * after ids have been regenerated and zone membership remapped, so the
 * reducer can splice the two arrays in without further validation.
 */
export interface MergeFixturesPayload {
  fixtures: Fixture[];
  zones: Zone[];
}

export interface CreateZonePayload {
  name: string;
  kind?: ZoneKind;
  mode?: ZoneMode;
  memberFixtureIds?: string[];
  roomIds?: string[];
  targetLux?: number;
}

export interface AddFixturesToZonePayload {
  zoneId: string;
  fixtureIds: string[];
}

export interface RemoveFixturesFromZonePayload {
  zoneId: string;
  fixtureIds: string[];
}

export interface DeleteZonesPayload {
  zoneIds: string[];
}

export interface SetSelectionPayload {
  fixtureIds?: string[];
  zoneIds?: string[];
}

export interface BeginCalculationPayload {
  kind: CalculationKind;
  scope?: CalculationScope;
  resolutionMeters?: number;
  heightMeters?: number;
  targetLux?: number;
}

export interface CalculationSucceededPayload {
  calculation: LightingCalculation;
}

export interface CalculationFailedPayload {
  kind: CalculationKind;
  error: string;
}

export interface BeginSavePayload {
  // No fields — presence triggers a save.
}

export interface SaveSucceededPayload {
  revision: number;
}

export interface SaveConflictPayload {
  serverRevision: number;
  clientRevision: number;
}

export interface SaveFailedPayload {
  error: string;
}

export interface ValidationSucceededPayload {
  report: ValidationReport;
}

export interface ValidationFailedPayload {
  error: string;
}

export interface SetRuleSetPayload {
  ruleSet: { id: string; name: string; rules: PlacementRule[] };
}

export interface ResetPayload {
  // No fields.
}

// ─── Serialization boundary ───────────────────────────────────────────────────

/**
 * Actions that serialize cleanly (all of them — the slice holds only
 * plain data). Listed here so future maintainers know the boundary.
 */
export type FixtureSliceAction =
  | { type: 'fixture/beginLoad'; payload: BeginLoadPayload }
  | { type: 'fixture/loadSucceeded'; payload: LoadSucceededPayload }
  | { type: 'fixture/loadFailed'; payload: LoadFailedPayload }
  | { type: 'fixture/setLayout'; payload: SetLayoutPayload }
  | { type: 'fixture/placeFixture'; payload: PlaceFixturePayload }
  | { type: 'fixture/moveFixtures'; payload: MoveFixturesPayload }
  | { type: 'fixture/rotateFixtures'; payload: RotateFixturesPayload }
  | { type: 'fixture/deleteFixtures'; payload: DeleteFixturesPayload }
  | { type: 'fixture/mergeFixtures'; payload: MergeFixturesPayload }
  | { type: 'fixture/createZone'; payload: CreateZonePayload }
  | { type: 'fixture/addFixturesToZone'; payload: AddFixturesToZonePayload }
  | { type: 'fixture/removeFixturesFromZone'; payload: RemoveFixturesFromZonePayload }
  | { type: 'fixture/deleteZones'; payload: DeleteZonesPayload }
  | { type: 'fixture/setSelection'; payload: SetSelectionPayload }
  | { type: 'fixture/beginCalculation'; payload: BeginCalculationPayload }
  | { type: 'fixture/calculationSucceeded'; payload: CalculationSucceededPayload }
  | { type: 'fixture/calculationFailed'; payload: CalculationFailedPayload }
  | { type: 'fixture/beginSave'; payload: BeginSavePayload }
  | { type: 'fixture/saveSucceeded'; payload: SaveSucceededPayload }
  | { type: 'fixture/saveConflict'; payload: SaveConflictPayload }
  | { type: 'fixture/saveFailed'; payload: SaveFailedPayload }
  | { type: 'fixture/validationSucceeded'; payload: ValidationSucceededPayload }
  | { type: 'fixture/validationFailed'; payload: ValidationFailedPayload }
  | { type: 'fixture/setRuleSet'; payload: SetRuleSetPayload }
  | { type: 'fixture/reset'; payload: ResetPayload };

// Re-exports for convenience — callers should import from here rather
// than reaching into model files directly.
export type { Fixture, FixtureKind, Zone, ZoneKind, ZoneMode, FixtureLayout, LightingCalculation, ValidationReport, PlacementRule };