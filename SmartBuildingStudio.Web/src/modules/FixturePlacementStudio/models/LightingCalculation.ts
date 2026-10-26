// src/modules/FixturePlacementStudio/models/LightingCalculation.ts
//
// One entry in the calculation history for a document.
//
// Calculations are DERIVED — never persisted with the document. They are
// produced by LuxCalculationService / PhotometricService and cached in
// Redux so the UI can show previous results, deltas, and trends without
// recomputing on every render.

export type CalculationKind =
  | 'lux-average'
  | 'uniformity'
  | 'illuminance-map'
  | 'emergency-compliance'
  | 'spacing-check';

export type CalculationStatus = 'pending' | 'running' | 'complete' | 'failed' | 'cancelled';

export type CalculationScope =
  | { type: 'document' }
  | { type: 'zone'; zoneId: string }
  | { type: 'room'; roomId: string }
  | { type: 'fixtures'; fixtureIds: string[] };

export interface CalculationInputs {
  productIds: string[];
  fixtureIds: string[];
  zoneIds: string[];
  ruleSetId?: string;
  extra?: Record<string, unknown>;
}

// ─── Result shapes by kind ────────────────────────────────────────────────────

export interface LuxAverageResult {
  kind: 'lux-average';
  averageLux: number;
  areaM2: number;
  perRoom?: Array<{ roomId: string; averageLux: number; areaM2: number }>;
  perZone?: Array<{ zoneId: string; averageLux: number }>;
}

export interface UniformityResult {
  kind: 'uniformity';
  minToAvg: number;
  minToMax: number;
  minLux: number;
  maxLux: number;
  averageLux: number;
}

/**
 * One sample in the illuminance map. Carries world coordinates (mm) and
 * the computed lux value. The PhotometricLayer renders directly from
 * these — no grid reconstruction needed.
 */
export interface IlluminanceSampleRecord {
  x: number;
  y: number;
  z: number;
  lux: number;
}

export interface IlluminanceMapResult {
  kind: 'illuminance-map';
  resolutionMeters: number;
  heightMeters: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  /**
   * Grid dimensions. Producers may leave these at 0 when `samples` is
   * populated; they exist only for producers that want to hand the
   * renderer a flat values array with explicit dimensions.
   */
  gridWidth: number;
  gridHeight: number;
  /** Flat lux values in row-major order. Kept for compactness. */
  values: number[];
  /**
   * The authoritative render source: one record per sampled point, with
   * world coordinates. Populated by LuxCalculationService from
   * PhotometricData.samples.
   */
  samples: IlluminanceSampleRecord[];
  minLux: number;
  maxLux: number;
  averageLux: number;
}

export interface EmergencyComplianceResult {
  kind: 'emergency-compliance';
  segments: Array<{
    segmentId: string;
    averageLux: number;
    minLux: number;
    compliant: boolean;
    contributingFixtureIds: string[];
  }>;
  failingSegmentCount: number;
}

export interface SpacingCheckResult {
  kind: 'spacing-check';
  violationsByRule: Record<
    string,
    Array<{
      fixtureIdA: string;
      fixtureIdB?: string;
      measured: number;
      required: number;
    }>
  >;
}

export type CalculationResult =
  | LuxAverageResult
  | UniformityResult
  | IlluminanceMapResult
  | EmergencyComplianceResult
  | SpacingCheckResult;

// ─── Calculation record ───────────────────────────────────────────────────────

export interface LightingCalculation {
  id: string;
  documentId: string;
  kind: CalculationKind;
  status: CalculationStatus;
  scope: CalculationScope;
  inputs: CalculationInputs;
  inputsHash: string;
  result?: CalculationResult;
  error?: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
}

// ─── Factories ────────────────────────────────────────────────────────────────

export function createCalculation(args: {
  id: string;
  documentId: string;
  kind: CalculationKind;
  scope: CalculationScope;
  inputs: CalculationInputs;
  inputsHash: string;
}): LightingCalculation {
  return {
    id: args.id,
    documentId: args.documentId,
    kind: args.kind,
    status: 'pending',
    scope: args.scope,
    inputs: args.inputs,
    inputsHash: args.inputsHash,
    startedAt: new Date().toISOString(),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isStale(
  calc: LightingCalculation,
  currentInputsHash: string
): boolean {
  return calc.inputsHash !== currentInputsHash;
}

export function isComplete(
  calc: LightingCalculation
): calc is LightingCalculation & { result: CalculationResult } {
  return calc.status === 'complete' && calc.result != null;
}

export function isFailed(
  calc: LightingCalculation
): calc is LightingCalculation & { error: string } {
  return calc.status === 'failed' && typeof calc.error === 'string';
}

export default LightingCalculation;