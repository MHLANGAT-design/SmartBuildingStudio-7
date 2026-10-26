// src/modules/Admin/ProductCatalog/hooks/useProductCatalog.ts
//
// Fetches the current product catalog via CatalogApi.listProducts().
// Kept module-scoped (not React state) so the dialogs can check dedupe
// without prop-drilling through the admin page.
//
// specifications arrives from the backend as a JSON-encoded string
// (ProductDto.specifications: string | null). We parse it on read so
// that NormalizedProduct.specifications is consistently an object.

import { useEffect, useState } from "react";
import { CatalogApi, type ProductDto } from "@/modules/FixturePlacementStudio/services/CatalogApi";
import type { NormalizedProduct } from "../converters";

interface CatalogCache {
  products: NormalizedProduct[];
  fetchedAt: number;
  inflight: Promise<NormalizedProduct[]> | null;
}

let cache: CatalogCache = {
  products: [],
  fetchedAt: 0,
  inflight: null,
};

const STALE_MS = 30_000;

function parseSpecifications(raw: string | null | undefined): unknown {
  if (raw == null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    // Backend stored a non-JSON string; pass it through as-is so
    // nothing downstream throws.
    return raw;
  }
}

function fromDto(dto: ProductDto): NormalizedProduct {
  return {
    productCode: dto.productCode,
    name: dto.name,
    productType: dto.productType,
    manufacturer: dto.manufacturer,
    family: dto.family ?? undefined,
    wattage: dto.wattage,
    lumens: dto.lumens,
    cri: dto.cri,
    colorTemperature: dto.colorTemperature,
    specifications: parseSpecifications(dto.specifications),
  };
}

function ensureFresh(): Promise<NormalizedProduct[]> {
  if (cache.inflight) return cache.inflight;
  const age = Date.now() - cache.fetchedAt;
  if (cache.products.length > 0 && age < STALE_MS) {
    return Promise.resolve(cache.products);
  }
  const p = CatalogApi.listProducts()
    .then((dtos) => {
      const products = dtos.map(fromDto);
      cache = { products, fetchedAt: Date.now(), inflight: null };
      return products;
    })
    .catch((err) => {
      cache.inflight = null;
      throw err;
    });
  cache = { ...cache, inflight: p };
  return p;
}

export function invalidateCatalog(): void {
  cache = { products: [], fetchedAt: 0, inflight: null };
}

export function useProductCatalog(): {
  products: NormalizedProduct[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  existingCodes: Set<string>;
  manufacturers: string[];
} {
  const [products, setProducts] = useState<NormalizedProduct[]>(cache.products);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    ensureFresh()
      .then((p) => setProducts(p))
      .catch((e) => setError(e.message ?? "Failed to fetch catalog"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const existingCodes = new Set(products.map((p) => p.productCode));
  const manufacturers = Array.from(
    new Set(products.map((p) => p.manufacturer).filter(Boolean))
  ).sort();

  return { products, loading, error, refetch: load, existingCodes, manufacturers };
}