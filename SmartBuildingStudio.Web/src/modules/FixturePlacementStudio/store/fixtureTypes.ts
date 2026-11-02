// src/modules/FixturePlacementStudio/store/fixtureTypes.ts

import type { FixtureLayout } from '@/modules/FixturePlacementStudio/models/FixtureLayout';
import type { Fixture, FixtureKind } from '@/modules/FixturePlacementStudio/models/Fixture';
import type { EmergencyLight } from '@/modules/FixturePlacementStudio/models/EmergencyLight';
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
  documentId: string | null;
  activationContext: {
    projectId: string;
    buildingId: string;
    floorId: string;
    documentId: string;
    revision: number;
  } | null;
  loadStatus: LoadStatus;
  loadError: string | null;
  saveStatus: SaveStatus;
  saveError: string | null;
  conflict: { serverRevision: number; clientRevision: number } | null;
  layout: FixtureLayout | null;
  selectedFixtureIds: string[];
  selectedZoneIds: string[];
  calculations: Record<CalculationKind, LightingCalculation | null>;
  calculationsHistory: LightingCalculation[];
  runningCalculation: CalculationKind | null;
  validationReport: ValidationReport | null;
  validating: boolean;
  ruleSet: { id: string; name: string; rules: PlacementRule[] } | null;
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
  /** Optional emergency-light payload for kind === 'emergencyLight'. */
  emergencyLight?: EmergencyLight;
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

export interface BeginSavePayload {}

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

export interface ResetPayload {}

// ─── Serialization boundary ───────────────────────────────────────────────────

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

export type { Fixture, FixtureKind, Zone, ZoneKind, ZoneMode, FixtureLayout, LightingCalculation, ValidationReport, PlacementRule };