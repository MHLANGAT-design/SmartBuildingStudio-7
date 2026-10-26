// src/modules/FixturePlacementStudio/models/PhotometricData.ts
//
// Photometric results for a document.
//
// These are DERIVED — never persisted to the DrawingDocument. They are
// produced by PhotometricService (which reads IES/LDT data from
// ProductCatalogService) and cached in Redux for display, heatmaps, and
// compliance reporting.
//
// Design notes:
//   - We do NOT store intensity distributions in this module. The IES
//     file, candlepower table, and beam characteristics live in
//     ProductCatalogService, keyed by productId. This file carries only
//     *results computed against a specific layout* — illuminance at
//     sampled points, uniformity metrics, etc.
//   - The exception is PhotometricDistribution: a lightweight
//     in-memory view of the catalog's distribution, produced by
//     PhotometricService and thrown away after the calculation. It is
//     not part of the persisted model, and it is not what gets stored
//     on a LightingCalculation result.
//   - PhotometricData is a pure data structure. No behaviour, no
//     factory beyond a trivial constructor. Computations live in
//     PhotometricService and LuxCalculationService.

// ─── Distribution (transient, in-memory) ──────────────────────────────────────

/**
 * A lightweight, in-memory view of a product's photometric distribution.
 *
 * Produced by PhotometricService after reading and normalizing an IES
 * or LDT file from ProductCatalogService. Consumed by the calculation
 * engine; thrown away once the calculation completes.
 *
 * This is NOT persisted. It is NOT part of a LightingCalculation. It
 * is a transient input to a computation.
 */
export interface PhotometricDistribution {
  /** Product this distribution belongs to. */
  productId: string;

  /**
   * Candlepower samples keyed by (horizontalAngle, verticalAngle).
   * Values are candelas. Angles are degrees, CCW for horizontal and
   * downward for vertical (0 = straight down = nadir).
   *
   * The shape is deliberately simple: a flat array of samples rather
   * than a dense matrix. IES files often have non-uniform sampling and
   * the consumer (LuxCalculationService) is responsible for
   * interpolating.
   */
  samples: Array<{
    horizontalAngle: number;
    verticalAngle: number;
    candela: number;
  }>;

  /** Total lumens emitted. IES field `luminous-flux` or equivalent. */
  totalLumens: number;

  /** Luminous efficacy in lm/W, if the catalog provides it. */
  efficacyLmPerW?: number;

  /** Symmetry of the distribution. Enables sampling reduction. */
  symmetry?: 'none' | 'rotational' | 'quadrantal' | 'bilateral';

  /** Source file name, for diagnostics. */
  sourceFile?: string;
}

// ─── Sampled illuminance ──────────────────────────────────────────────────────

/**
 * A single sampled illuminance point in world space.
 *
 * Kept as a lightweight tuple-shaped object so large grids stay compact.
 */
export interface IlluminanceSample {
  /** World-space X. */
  x: number;
  /** World-space Y. */
  y: number;
  /** Elevation above floor in meters at which the value was computed. */
  z: number;
  /** Computed illuminance in lux. */
  lux: number;
}

// ─── Photometric results ──────────────────────────────────────────────────────

export type PhotometricComputationStatus =
  | 'pending'
  | 'computing'
  | 'complete'
  | 'failed';

/**
 * Photometric result for a document (or scope within it).
 *
 * This is the shape a LightingCalculation's `result` field can carry
 * when kind is 'illuminance-map' or 'lux-average'. It is also what
 * HeatmapLayer reads to render.
 *
 * Stored in Redux only. Never persisted.
 */
export interface PhotometricData {
  /** Unique id for this result. Same as the LightingCalculation id it belongs to. */
  id: string;

  /** Document this result describes. */
  documentId: string;

  /** Status of the computation that produced this result. */
  status: PhotometricComputationStatus;

  /**
   * Scope this result covers. Mirrors LightingCalculation.scope so
   * results can be indexed and invalidated the same way.
   */
  scope:
    | { type: 'document' }
    | { type: 'zone'; zoneId: string }
    | { type: 'room'; roomId: string }
    | { type: 'fixtures'; fixtureIds: string[] };

  /** Height plane above floor in meters. */
  heightMeters: number;

  /** Grid resolution in meters. Only meaningful for gridded results. */
  resolutionMeters: number;

  /** World-space bounds covered by this result. */
  bounds: { minX: number; minY: number; maxX: number; maxY: number };

  /** Sampled illuminance values. Empty when status !== 'complete'. */
  samples: IlluminanceSample[];

  /** Derived summary metrics. Undefined when status !== 'complete'. */
  summary?: PhotometricSummary;

  /** Human-readable error when status === 'failed'. */
  error?: string;

  /** ISO timestamp the computation finished. */
  computedAt?: string;

  /**
   * Ids of the fixtures that contributed to this result. Used for
   * invalidation: if any of these fixtures change, the result is stale.
   */
  contributingFixtureIds: string[];

  /**
   * Rule set id used during the run, if any. Carried through so a
   * compliance result is self-describing.
   */
  ruleSetId?: string;
}

// ─── Summary metrics ──────────────────────────────────────────────────────────

/**
 * Aggregated metrics derived from `samples`. Computed alongside the
 * samples by LuxCalculationService; cached here so renderers and
 * inspectors don't recompute.
 */
export interface PhotometricSummary {
  /** Average lux across all samples. */
  averageLux: number;

  /** Minimum sampled lux. */
  minLux: number;

  /** Maximum sampled lux. */
  maxLux: number;

  /**
   * Uniformity ratio U0 = min / average. Common in EN 12464-1.
   * Undefined when averageLux is zero.
   */
  uniformityU0?: number;

  /**
   * Uniformity ratio Ud = min / max. Some standards prefer this.
   */
  uniformityUd?: number;

  /**
   * Total area in square meters that the samples cover. Approximated as
   * sampleCount * resolutionMeters^2 for gridded results.
   */
  areaM2: number;

  /**
   * Count of samples below a given threshold. The threshold is supplied
   * by the caller (typically a zone's targetLux); if no threshold was
   * given, this is 0.
   */
  samplesBelowTarget: number;

  /** The threshold used for samplesBelowTarget, if any. */
  targetLuxUsed?: number;
}

// ─── Empty / failure helpers ──────────────────────────────────────────────────

export function emptyPhotometricData(args: {
  id: string;
  documentId: string;
  scope: PhotometricData['scope'];
  heightMeters?: number;
  resolutionMeters?: number;
}): PhotometricData {
  return {
    id: args.id,
    documentId: args.documentId,
    status: 'pending',
    scope: args.scope,
    heightMeters: args.heightMeters ?? 0.8, // default work-plane height
    resolutionMeters: args.resolutionMeters ?? 0.25,
    bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    samples: [],
    contributingFixtureIds: [],
  };
}

export function failedPhotometricData(args: {
  id: string;
  documentId: string;
  scope: PhotometricData['scope'];
  error: string;
  heightMeters?: number;
  resolutionMeters?: number;
}): PhotometricData {
  return {
    ...emptyPhotometricData({
      id: args.id,
      documentId: args.documentId,
      scope: args.scope,
      heightMeters: args.heightMeters,
      resolutionMeters: args.resolutionMeters,
    }),
    status: 'failed',
    error: args.error,
  };
}

export default PhotometricData;