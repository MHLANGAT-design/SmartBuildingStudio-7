// src/modules/FixturePlacementStudio/services/ProductCatalogPhotometricResolver.ts
//
// Bridges ProductCatalogService (HTTP + wire DTO) and PhotometricService
// (in-memory domain model).
//
// Responsibilities:
//   1. Translate wire DTO → domain PhotometricDistribution.
//   2. Cache resolutions by productId for the lifetime of a session.
//   3. Deduplicate concurrent in-flight requests.
//   4. Degrade gracefully — a failed lookup is cached as null so
//      subsequent fixtures of the same product skip the HTTP call.
//
// This is the resolver that gets passed to setPhotometricResolver().

import type {
  PhotometricDistribution,
} from '@/modules/FixturePlacementStudio/models/PhotometricData';
import type { PhotometricDistributionResolver } from '@/modules/FixturePlacementStudio/services/PhotometricService';
import {
  CatalogApi,
  CatalogApiError,
  type PhotometricDistributionDto,
} from '@/modules/FixturePlacementStudio/services/CatalogApi';

// ─── Options ──────────────────────────────────────────────────────────────────

export interface ProductCatalogResolverOptions {
  /**
   * When true, a failed lookup is retried once. Off by default so
   * tests are deterministic.
   */
  retryOnFailure?: boolean;

  /**
   * Optional logger. Defaults to console.warn. Swap for your app logger.
   */
  onWarn?: (message: string, detail?: unknown) => void;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Build a PhotometricDistributionResolver backed by ProductCatalogService.
 *
 * Stateful — the returned resolver caches per productId. Construct one
 * per calculation session, not once per app lifetime, unless you intend
 * long-lived caching across sessions.
 */
export function createProductCatalogPhotometricResolver(
  options: ProductCatalogResolverOptions = {}
): PhotometricDistributionResolver {
  // Resolved values, including explicit nulls ("no file for this product").
  const cache = new Map<string, PhotometricDistribution | null>();

  // In-flight requests, so parallel fixtures of the same product share
  // one HTTP call.
  const inFlight = new Map<string, Promise<PhotometricDistribution | null>>();

  const warn =
    options.onWarn ??
    ((msg, detail) => {
      // eslint-disable-next-line no-console
      console.warn(msg, detail);
    });

  return async function resolve(
    productId: string
  ): Promise<PhotometricDistribution | null> {
    // 1. Cache hit (including null hits).
    if (cache.has(productId)) return cache.get(productId)!;

    // 2. In-flight deduplication.
    const existing = inFlight.get(productId);
    if (existing) return existing;

    // 3. New request.
    const promise = (async () => {
      try {
        const dto = await fetchWithOptionalRetry(productId, options.retryOnFailure);
        const domain = dto ? mapDtoToDomain(dto) : null;
        cache.set(productId, domain);
        return domain;
      } catch (err) {
        const message =
          err instanceof CatalogApiError
            ? `CatalogApi error for product ${productId}: ${err.status}`
            : `Unexpected error resolving product ${productId}`;
        warn(message, err);
        cache.set(productId, null);
        return null;
      } finally {
        inFlight.delete(productId);
      }
    })();

    inFlight.set(productId, promise);
    return promise;
  };
}

// ─── Internals ────────────────────────────────────────────────────────────────

async function fetchWithOptionalRetry(
  productId: string,
  retry: boolean | undefined
): Promise<PhotometricDistributionDto | null> {
  try {
    return await CatalogApi.getPhotometricDistribution(productId);
  } catch (err) {
    if (!retry) throw err;
    // One retry — no backoff. Interactive sessions don't want to
    // stall on a slow failure.
    return await CatalogApi.getPhotometricDistribution(productId);
  }
}

/**
 * Translate the wire DTO into the domain model PhotometricService uses.
 *
 * The mapping is explicit so that a DTO change on the backend surfaces
 * here as a compile error, not as silently-wrong lux values.
 *
 * NULL BRIDGE:
 *   The C# DTO declares EfficacyLmPerW / Symmetry / SourceFile as
 *   nullable. The JSON contains literal `null` for those. The domain
 *   model (PhotometricData.ts) declares them as optional (`?:`), which
 *   means `undefined`. This function converts null → undefined so the
 *   domain model receives the shape its types promise.
 *
 * UNITS:
 *   Candela is passed through unchanged. The backend delivers absolute
 *   candelas, which is what PhotometricService.contribution() expects.
 *   If that ever changes to normalized (cd/klm), multiply by
 *   `totalLumens / 1000` here.
 *
 * SYMMETRY:
 *   PhotometricService.sampleCandela currently only reads the C0 plane
 *   (horizontalAngle === 0). Asymmetric distributions are a known v1.0
 *   limitation; the interpolator upgrade is a separate task. The
 *   symmetry value is carried through for diagnostics and future use.
 */
function mapDtoToDomain(dto: PhotometricDistributionDto): PhotometricDistribution {
  if (!dto.samples || dto.samples.length === 0) {
    throw new Error(
      `Photometric distribution for product ${dto.productId} has no samples.`
    );
  }

  const samples = dto.samples.map((s) => ({
    horizontalAngle: s.horizontalAngle,
    verticalAngle: s.verticalAngle,
    candela: s.candela,
  }));

  return {
    productId: dto.productId,
    samples,
    totalLumens: dto.totalLumens,
    // null → undefined bridge (domain model expects optional, not nullable)
    efficacyLmPerW: dto.efficacyLmPerW ?? undefined,
    symmetry: normalizeSymmetry(dto.symmetry ?? undefined),
    sourceFile: dto.sourceFile ?? undefined,
  };
}

/**
 * Normalize arbitrary backend symmetry strings onto the domain enum.
 *
 * The domain type uses 'quadrantal' (not 'quadrant'). The IES LM-63
 * spec encodes symmetry numerically (1–4), but the backend may
 * translate that to words. Handle both:
 *
 *   IES code 1 → no symmetry (full C-plane data)
 *   IES code 2 → 0–90° (quadrantal)
 *   IES code 3 → 0–180° (bilateral)
 *   IES code 4 → rotational
 *
 * Unknown values fall back to 'rotational' — the safest assumption,
 * because a rotational source with only C0 data still produces a valid
 * (if approximate) illuminance result, whereas 'none' would silently
 * mislead the sampler.
 */
function normalizeSymmetry(
  raw: string | undefined
): PhotometricDistribution['symmetry'] {
  const s = (raw ?? '').toLowerCase().trim();

  // Named values from the backend.
  if (s === 'rotational' || s === 'quadrantal' || s === 'bilateral' || s === 'none') {
    return s as PhotometricDistribution['symmetry'];
  }

  // IES LM-63 numeric codes, in case the backend stores raw values.
  if (s === '2') return 'quadrantal';
  if (s === '3') return 'bilateral';
  if (s === '4') return 'rotational';
  if (s === '1') return 'none';

  // Unknown → rotational (safest fallback).
  return 'rotational';
}

export default createProductCatalogPhotometricResolver;