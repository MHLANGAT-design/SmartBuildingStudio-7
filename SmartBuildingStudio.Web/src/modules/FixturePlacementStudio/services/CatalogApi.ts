// src/modules/FixturePlacementStudio/services/CatalogApi.ts
//
// Thin HTTP client for ProductCatalogService.
//
// Scoped to the endpoints FixturePlacementStudio actually consumes:
//   - photometric-distribution
//   - product lookup
//   - product listing with optional filters
//   - distinct manufacturer / family lists (for dropdowns)
//   - manufacturer aggregate (for the admin page)
//
// Uses the same error and transport conventions as FixtureApi.

import { API_ROUTES } from '@/Application/ApiRoutes';

// ─── Errors ───────────────────────────────────────────────────────────────────

export class CatalogApiError extends Error {
  public readonly status: number;
  public readonly url: string;
  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = 'CatalogApiError';
    this.status = status;
    this.url = url;
  }
}

// ─── Wire DTOs ────────────────────────────────────────────────────────────────

export interface PhotometricDistributionSampleDto {
  horizontalAngle: number;
  verticalAngle: number;
  candela: number;
}

export interface PhotometricDistributionDto {
  productId: string;
  totalLumens: number;
  symmetry?: string | null;
  sourceFile?: string | null;
  efficacyLmPerW?: number | null;
  samples: PhotometricDistributionSampleDto[];
}

/**
 * Mirrors ProductCatalogService.Application.DTOs.ProductDto exactly.
 *
 * `productType` is a *string* (enum name: "Luminaire", "Driver", …).
 * `family` and `specifications` are the only optional members.
 */
export interface ProductDto {
  id: string;
  productCode: string;
  name: string;
  productType: string;
  wattage: number;
  lumens: number;
  cri: number;
  colorTemperature: number;
  manufacturer: string;
  family?: string | null;
  specifications?: string | null;
}

/**
 * Optional filters for `CatalogApi.listProducts`. All fields are
 * optional; omitted fields apply no filter. Multiple fields combine
 * with AND on the backend.
 */
export interface ProductFilters {
  /** Case-insensitive exact match on manufacturer. */
  manufacturer?: string;
  /** Case-insensitive exact match on family / series. */
  family?: string;
  /** Numeric ProductType enum value (1 = Luminaire, 2 = Driver, …). */
  type?: number;
  /** Case-insensitive substring across name, productCode, and manufacturer. */
  search?: string;
}

/**
 * Mirrors ProductCatalogService.Application.DTOs.ManufacturerStatsDto.
 * One row per distinct manufacturer with its product count.
 */
export interface ManufacturerStatsDto {
  name: string;
  productCount: number;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class CatalogApi {
  /**
   * Fetch the active photometric distribution for a product.
   * Returns null on 404.
   */
  static async getPhotometricDistribution(
    productId: string,
    signal?: AbortSignal
  ): Promise<PhotometricDistributionDto | null> {
    const url =
      API_ROUTES.PRODUCT_CATALOG_SERVICE.PHOTOMETRIC_FILES.DISTRIBUTION(productId);

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });

    if (response.status === 404) return null;

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new CatalogApiError(
        `HTTP ${response.status} ${response.statusText}: ${text}`,
        response.status,
        url
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new CatalogApiError(
        `Expected JSON but got "${contentType}" — check reverse-proxy rules for ${url}`,
        0,
        url
      );
    }

    return (await response.json()) as PhotometricDistributionDto;
  }

  /**
   * Fetch a product by id. Returns null on 404.
   */
  static async getProduct(
    productId: string,
    signal?: AbortSignal
  ): Promise<ProductDto | null> {
    const url = API_ROUTES.PRODUCT_CATALOG_SERVICE.PRODUCTS.GET(productId);

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });

    if (response.status === 404) return null;

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new CatalogApiError(
        `HTTP ${response.status} ${response.statusText}: ${text}`,
        response.status,
        url
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new CatalogApiError(
        `Expected JSON but got "${contentType}" — check reverse-proxy rules for ${url}`,
        0,
        url
      );
    }

    return (await response.json()) as ProductDto;
  }

  /**
   * List products, optionally filtered. Filters combine with AND.
   * Returns an empty array when no products match.
   *
   * @example
   *   await CatalogApi.listProducts()
   *   await CatalogApi.listProducts({ manufacturer: "Philips" })
   *   await CatalogApi.listProducts({ manufacturer: "Philips", family: "Xitanium" })
   *   await CatalogApi.listProducts({ type: 2 })          // 2 = Driver
   *   await CatalogApi.listProducts({ search: "2800" })
   */
  static async listProducts(
    filters?: ProductFilters,
    signal?: AbortSignal
  ): Promise<ProductDto[]> {
    const base = API_ROUTES.PRODUCT_CATALOG_SERVICE.PRODUCTS.LIST;

    // Build query string from non-empty filters.
    const qs = new URLSearchParams();
    if (filters) {
      if (filters.manufacturer && filters.manufacturer.trim().length > 0) {
        qs.set('manufacturer', filters.manufacturer.trim());
      }
      if (filters.family && filters.family.trim().length > 0) {
        qs.set('family', filters.family.trim());
      }
      if (typeof filters.type === 'number') {
        qs.set('type', String(filters.type));
      }
      if (filters.search && filters.search.trim().length > 0) {
        qs.set('search', filters.search.trim());
      }
    }
    const url = qs.toString() ? `${base}?${qs.toString()}` : base;

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new CatalogApiError(
        `HTTP ${response.status} ${response.statusText}: ${text}`,
        response.status,
        url
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new CatalogApiError(
        `Expected JSON but got "${contentType}" — check reverse-proxy rules for ${url}`,
        0,
        url
      );
    }

    return (await response.json()) as ProductDto[];
  }

  /**
   * List the distinct manufacturer names present in the catalog.
   * Excludes products with no manufacturer. Sorted alphabetically.
   */
  static async listManufacturers(signal?: AbortSignal): Promise<string[]> {
    const url = API_ROUTES.PRODUCT_CATALOG_SERVICE.PRODUCTS.MANUFACTURERS;

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new CatalogApiError(
        `HTTP ${response.status} ${response.statusText}: ${text}`,
        response.status,
        url
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new CatalogApiError(
        `Expected JSON but got "${contentType}" — check reverse-proxy rules for ${url}`,
        0,
        url
      );
    }

    return (await response.json()) as string[];
  }

  /**
   * Aggregate the catalog by manufacturer: one row per distinct
   * manufacturer with its product count. Sorted alphabetically.
   * Used by the manufacturer admin page.
   */
  static async getManufacturerStats(
    signal?: AbortSignal
  ): Promise<ManufacturerStatsDto[]> {
    const url =
      API_ROUTES.PRODUCT_CATALOG_SERVICE.PRODUCTS.MANUFACTURER_STATS;

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new CatalogApiError(
        `HTTP ${response.status} ${response.statusText}: ${text}`,
        response.status,
        url
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new CatalogApiError(
        `Expected JSON but got "${contentType}" — check reverse-proxy rules for ${url}`,
        0,
        url
      );
    }

    return (await response.json()) as ManufacturerStatsDto[];
  }

  /**
   * List the distinct family names present in the catalog.
   * Excludes products with no family. Sorted alphabetically.
   */
  static async listFamilies(signal?: AbortSignal): Promise<string[]> {
    const url = API_ROUTES.PRODUCT_CATALOG_SERVICE.PRODUCTS.FAMILIES;

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new CatalogApiError(
        `HTTP ${response.status} ${response.statusText}: ${text}`,
        response.status,
        url
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new CatalogApiError(
        `Expected JSON but got "${contentType}" — check reverse-proxy rules for ${url}`,
        0,
        url
      );
    }

    return (await response.json()) as string[];
  }
}

export default CatalogApi;