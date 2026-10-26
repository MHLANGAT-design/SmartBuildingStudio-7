// src/modules/FixturePlacementStudio/services/PhotometricService.ts
//
// Reads photometric distributions from ProductCatalogService and
// computes illuminance data for a FixtureLayout.
//
// MODEL (v1.0):
//   Direct illuminance only. Each fixture is a point source; each
//   contribution follows E = I(theta)·cos(theta)/d². Walls are treated
//   as opaque segment obstructions. Doors and windows are opaque for
//   Tier 1 — they'll get transmittance in a later tier. No daylight,
//   no interreflection. Results are indicative, not design-grade.
//
// UNIT CONVENTION:
//   World coordinates are stored in MILLIMETERS. Photometric formulas
//   work in METERS. MM_PER_METER and the conversion in `contribution()`
//   are the single place this boundary is handled.

import type { FixtureLayout } from '@/modules/FixturePlacementStudio/models/FixtureLayout';
import type { Fixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import type {
  PhotometricDistribution,
  PhotometricData,
  IlluminanceSample,
  PhotometricSummary,
} from '@/modules/FixturePlacementStudio/models/PhotometricData';
import { emptyPhotometricData, failedPhotometricData } from '@/modules/FixturePlacementStudio/models/PhotometricData';

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * Function type for resolving a photometric distribution by product id.
 *
 * Additionally carries an optional clearCache() method. Resolvers that
 * cache per-product lookups (like the product-catalog-backed resolver)
 * expose clearCache so callers can invalidate after a file upload. The
 * stub resolver doesn't need it — optional means existing implementations
 * compile unchanged.
 */
export type PhotometricDistributionResolver = ((
  productId: string
) => Promise<PhotometricDistribution | null>) & {
  clearCache?: () => void;
};

/**
 * A wall segment in world coordinates (mm). Doors and windows are
 * represented by the wall segments beneath them; for Tier 1, all
 * segments are opaque.
 */
export interface WallSegment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  /** Bounding box, pre-computed for fast ray rejection. */
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface PhotometricComputeOptions {
  bounds?: { minX: number; minY: number; maxX: number; maxY: number };
  resolutionMeters?: number;
  heightMeters?: number;
  targetLux?: number;
  /**
   * Wall (and door, and window) segments in world coordinates, used
   * for occlusion. Pass an empty array for an occlusion-free
   * calculation.
   */
  walls?: WallSegment[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MM_PER_METER = 1000;
const DEFAULT_FIXTURE_ELEVATION_METERS = 2.8;
const MAX_SAMPLES = 40000;

/**
 * Per-fixture wall pre-filter radius, in world units (mm). Walls
 * farther than this from a fixture can't meaningfully occlude it,
 * because the fixture's contribution at that distance is already
 * below ~0.5 lx. 5000 mm = 5 m.
 */
const OCCLUSION_REACH_MM = 5000;

/**
 * Minimum lux below which a ray is considered unblocked regardless of
 * geometry — there's nothing worth occluding.
 */
const MIN_MEANINGFUL_CONTRIBUTION_LUX = 0.05;

// ─── Service ──────────────────────────────────────────────────────────────────

export class PhotometricService {
  private readonly resolver: PhotometricDistributionResolver;

  constructor(resolver: PhotometricDistributionResolver) {
    this.resolver = resolver;
  }

  async compute(
    layout: FixtureLayout,
    options?: PhotometricComputeOptions
  ): Promise<PhotometricData> {
    const resolutionMeters = options?.resolutionMeters ?? 0.25;
    const heightMeters = options?.heightMeters ?? 0.8;
    const targetLux = options?.targetLux;
    const walls = options?.walls ?? [];

    const bounds = options?.bounds ?? PhotometricService.deriveBounds(layout);
    if (!bounds) {
      return failedPhotometricData({
        id: `calc-${Date.now()}`,
        documentId: layout.documentId,
        scope: { type: 'document' },
        error: 'No fixtures to sample.',
        heightMeters,
        resolutionMeters,
      });
    }

    const grid = PhotometricService.buildGrid(bounds, resolutionMeters);

    const fixtures = layout.fixtures;
    if (fixtures.length === 0) {
      return failedPhotometricData({
        id: `calc-${Date.now()}`,
        documentId: layout.documentId,
        scope: { type: 'document' },
        error: 'No fixtures in layout.',
        heightMeters,
        resolutionMeters,
      });
    }

    // ── Resolve distributions once per product. ─────────────────────
    const distributions = new Map<string, PhotometricDistribution | null>();
    for (const fixture of fixtures) {
      if (distributions.has(fixture.productId)) continue;
      const dist = await this.resolver(fixture.productId);
      distributions.set(fixture.productId, dist);
    }

    // ── Pre-filter walls per fixture. ───────────────────────────────
    // For each fixture, keep only walls within OCCLUSION_REACH_MM of
    // its position. This is the big performance win — most fixtures
    // see 20–50 candidate walls instead of thousands.
    const wallsByFixture = new Map<string, WallSegment[]>();
    for (const f of fixtures) {
      if (walls.length === 0) {
        wallsByFixture.set(f.id, []);
        continue;
      }
      const reach = OCCLUSION_REACH_MM;
      const near = walls.filter(
        (w) =>
          w.maxX >= f.x - reach &&
          w.minX <= f.x + reach &&
          w.maxY >= f.y - reach &&
          w.minY <= f.y + reach
      );
      wallsByFixture.set(f.id, near);
    }

    // ── Sample grid. ────────────────────────────────────────────────
    const samples: IlluminanceSample[] = [];
    for (const point of grid) {
      let totalLux = 0;
      for (const fixture of fixtures) {
        const dist = distributions.get(fixture.productId);
        if (!dist) continue;

        // Cheap check first: if the fixture can't contribute
        // meaningfully even without walls, skip the geometry test.
        const tentative = PhotometricService.contribution(
          fixture,
          dist,
          point.x,
          point.y,
          heightMeters
        );
        if (tentative <= MIN_MEANINGFUL_CONTRIBUTION_LUX) continue;

        // Occlusion check against pre-filtered walls.
        const nearWalls = wallsByFixture.get(fixture.id) ?? [];
        if (
          nearWalls.length > 0 &&
          PhotometricService.isBlocked(
            fixture.x,
            fixture.y,
            point.x,
            point.y,
            nearWalls
          )
        ) {
          continue;
        }

        totalLux += tentative;
      }
      samples.push({
        x: point.x,
        y: point.y,
        z: heightMeters,
        lux: totalLux,
      });
    }

    const summary = PhotometricService.summarize(
      samples,
      resolutionMeters,
      targetLux
    );

    const result = emptyPhotometricData({
      id: `calc-${Date.now()}`,
      documentId: layout.documentId,
      scope: { type: 'document' },
      heightMeters,
      resolutionMeters,
    });
    result.status = 'complete';
    result.bounds = bounds;
    result.samples = samples;
    result.summary = summary;
    result.contributingFixtureIds = fixtures.map((f) => f.id);
    result.computedAt = new Date().toISOString();
    return result;
  }

  // ─── Internals ───────────────────────────────────────────────────────

  private static deriveBounds(
    layout: FixtureLayout
  ): { minX: number; minY: number; maxX: number; maxY: number } | null {
    if (layout.fixtures.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const f of layout.fixtures) {
      if (f.x < minX) minX = f.x;
      if (f.x > maxX) maxX = f.x;
      if (f.y < minY) minY = f.y;
      if (f.y > maxY) maxY = f.y;
    }
    const pad = 5000; // mm
    return {
      minX: minX - pad,
      minY: minY - pad,
      maxX: maxX + pad,
      maxY: maxY + pad,
    };
  }

  private static buildGrid(
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
    resolutionMeters: number
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    const stepMm = Math.max(1, resolutionMeters * MM_PER_METER);
    const spanX = bounds.maxX - bounds.minX;
    const spanY = bounds.maxY - bounds.minY;
    const cols = Math.floor(spanX / stepMm) + 1;
    const rows = Math.floor(spanY / stepMm) + 1;
    const total = cols * rows;
    const stride = total > MAX_SAMPLES
      ? Math.ceil(Math.sqrt(total / MAX_SAMPLES))
      : 1;

    for (let j = 0; j < rows; j += stride) {
      for (let i = 0; i < cols; i += stride) {
        points.push({
          x: bounds.minX + i * stepMm,
          y: bounds.minY + j * stepMm,
        });
      }
    }
    return points;
  }

  private static contribution(
    fixture: Fixture,
    dist: PhotometricDistribution,
    px: number,
    py: number,
    planeHeightMeters: number
  ): number {
    const dx_m = (px - fixture.x) / MM_PER_METER;
    const dy_m = (py - fixture.y) / MM_PER_METER;
    const horizontalDist = Math.hypot(dx_m, dy_m);

    const rawElev = fixture.elevation ?? 0;
    const fixtureElev =
      rawElev > planeHeightMeters
        ? rawElev
        : DEFAULT_FIXTURE_ELEVATION_METERS;

    if (fixtureElev <= planeHeightMeters) return 0;

    const verticalDist = fixtureElev - planeHeightMeters;
    const totalDist = Math.hypot(horizontalDist, verticalDist);
    const theta = Math.atan2(horizontalDist, verticalDist);

    const candela = PhotometricService.sampleCandela(dist, theta);
    if (candela <= 0) return 0;

    return (candela * Math.cos(theta)) / (totalDist * totalDist);
  }

  /**
   * Does any wall segment cross the fixture-to-sample ray?
   *
   * The ray is treated as a 2D segment (walls are assumed infinitely
   * tall). Uses a bounding-box pre-reject per wall before the actual
   * intersection test.
   */
  private static isBlocked(
    fx: number,
    fy: number,
    sx: number,
    sy: number,
    walls: WallSegment[]
  ): boolean {
    const rayMinX = fx < sx ? fx : sx;
    const rayMaxX = fx < sx ? sx : fx;
    const rayMinY = fy < sy ? fy : sy;
    const rayMaxY = fy < sy ? sy : fy;

    for (const w of walls) {
      if (w.maxX < rayMinX || w.minX > rayMaxX) continue;
      if (w.maxY < rayMinY || w.minY > rayMaxY) continue;

      if (PhotometricService.segmentsIntersect(
        fx, fy, sx, sy,
        w.ax, w.ay, w.bx, w.by
      )) {
        return true;
      }
    }
    return false;
  }

  /**
   * Standard segment-segment intersection. Returns true if AB and CD
   * share any point, including endpoints.
   */
  private static segmentsIntersect(
    ax: number, ay: number,
    bx: number, by: number,
    cx: number, cy: number,
    dx: number, dy: number
  ): boolean {
    const r_x = bx - ax;
    const r_y = by - ay;
    const s_x = dx - cx;
    const s_y = dy - cy;

    const denom = r_x * s_y - r_y * s_x;
    if (Math.abs(denom) < 1e-9) {
      // Parallel — treat as non-blocking (avoids false positives on
      // collinear segments).
      return false;
    }

    const t = ((cx - ax) * s_y - (cy - ay) * s_x) / denom;
    const u = ((cx - ax) * r_y - (cy - ay) * r_x) / denom;

    return t > 0 && t < 1 && u > 0 && u < 1;
  }

  private static sampleCandela(
    dist: PhotometricDistribution,
    theta: number
  ): number {
    if (!dist.samples || dist.samples.length === 0) return 0;
    const thetaDeg = (theta * 180) / Math.PI;

    let best = dist.samples[0];
    let bestDelta = Math.abs(best.verticalAngle - thetaDeg);
    for (const s of dist.samples) {
      if (s.horizontalAngle !== 0) continue;
      const delta = Math.abs(s.verticalAngle - thetaDeg);
      if (delta < bestDelta) {
        best = s;
        bestDelta = delta;
      }
    }
    return best.candela;
  }

  private static summarize(
    samples: IlluminanceSample[],
    resolutionMeters: number,
    targetLux?: number
  ): PhotometricSummary {
    if (samples.length === 0) {
      return {
        averageLux: 0,
        minLux: 0,
        maxLux: 0,
        areaM2: 0,
        samplesBelowTarget: 0,
        targetLuxUsed: targetLux,
      };
    }

    let sum = 0;
    let min = Infinity;
    let max = -Infinity;
    let belowTarget = 0;
    for (const s of samples) {
      sum += s.lux;
      if (s.lux < min) min = s.lux;
      if (s.lux > max) max = s.lux;
      if (targetLux != null && s.lux < targetLux) belowTarget++;
    }

    const average = sum / samples.length;
    const areaM2 = samples.length * resolutionMeters * resolutionMeters;

    return {
      averageLux: average,
      minLux: min,
      maxLux: max,
      uniformityU0: average > 0 ? min / average : undefined,
      uniformityUd: max > 0 ? min / max : undefined,
      areaM2,
      samplesBelowTarget: belowTarget,
      targetLuxUsed: targetLux,
    };
  }
}

// ─── Wall extraction helper ───────────────────────────────────────────────────

/**
 * Extract wall segments from the raw element array (walls, doors,
 * windows, rooms). Doors and windows are treated as opaque wall
 * segments for Tier 1 — their underlying segments occlude light.
 *
 * Only elements with a `points` array of length >= 2 are used. Each
 * consecutive pair of points becomes a segment (so a polyline
 * contributes one segment per span).
 */
export function extractWallSegments(elements: any[]): WallSegment[] {
  const out: WallSegment[] = [];
  if (!Array.isArray(elements)) return out;

  for (const el of elements) {
    if (!el) continue;
    const t = String(el.type ?? el.Type ?? '').toLowerCase();
    const isWall = t === 'wall' || t === 'walls' || t === 'polyline' || t === '';
    const isDoor = t === 'door' || t === 'doors';
    const isWindow = t === 'window' || t === 'windows';
    if (!isWall && !isDoor && !isWindow) continue;

    const pts = el.points || el.vertices || [];
    if (!Array.isArray(pts) || pts.length < 2) continue;

    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      if (!p1 || !p2) continue;
      const ax = Number(p1.x);
      const ay = Number(p1.y);
      const bx = Number(p2.x);
      const by = Number(p2.y);
      if (!isFinite(ax) || !isFinite(ay) || !isFinite(bx) || !isFinite(by)) {
        continue;
      }
      out.push({
        ax, ay, bx, by,
        minX: Math.min(ax, bx),
        minY: Math.min(ay, by),
        maxX: Math.max(ax, bx),
        maxY: Math.max(ay, by),
      });
    }
  }

  return out;
}

// ─── Stub resolver ────────────────────────────────────────────────────────────

export function createStubDistributionResolver(): PhotometricDistributionResolver {
  const cache = new Map<string, PhotometricDistribution>();
  return async (productId: string) => {
    if (cache.has(productId)) return cache.get(productId)!;
    const samples: PhotometricDistribution['samples'] = [];
    const totalLumens = 4000;
    const peakCandela = 1600;
    for (let deg = 0; deg <= 180; deg += 5) {
      const rad = (deg * Math.PI) / 180;
      const intensity = deg <= 90
        ? peakCandela * Math.max(0, Math.cos(rad))
        : 0;
      samples.push({
        horizontalAngle: 0,
        verticalAngle: deg,
        candela: intensity,
      });
    }
    const dist: PhotometricDistribution = {
      productId,
      samples,
      totalLumens,
      symmetry: 'rotational',
      sourceFile: 'stub',
    };
    cache.set(productId, dist);
    return dist;
  };
}

export default PhotometricService;