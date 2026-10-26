// scripts/import-catalogs/lib/normalizeProduct.ts
//
// Canonical ProductDto shape accepted by
// POST /api/productcatalog/catalog/import/json.
//
// Every manufacturer converter produces NormalizedProduct[] and dumps
// them here. The normalize helper enforces required fields and pads
// optional ones with defaults so the endpoint sees a consistent shape.

export interface NormalizedProduct {
  productCode: string;
  name: string;
  productType: string;         // must match a backend ProductType enum name
  manufacturer: string;
  family?: string;             // product family / series (optional)
  wattage?: number;
  lumens?: number;
  cri?: number;
  colorTemperature?: number;
  specifications?: unknown;     // arbitrary — preserved verbatim
}

export interface ConvertResult {
  products: NormalizedProduct[];
  skipped: Array<{ reason: string; raw: unknown }>;
}

/**
 * Canonical units for values that will be compared across manufacturers.
 * Store these canonical forms in `specifications` when the raw vendor
 * value is in a different unit, so downstream comparisons are unit-safe.
 *
 * Currents: milliamps (mA). Tridonic already uses mA; Philips uses A and
 * must be multiplied by 1000.
 *
 * Voltages: volts (V), numeric. Ranges are [min, max] tuples.
 * Wattages: watts (W), numeric.
 * Color temperatures: Kelvin (K), numeric.
 */
export const CANONICAL_UNITS = {
  current: "mA",
  voltage: "V",
  wattage: "W",
  colorTemperature: "K",
} as const;

/** Reject products missing the four required fields. */
export function isValidProduct(p: NormalizedProduct): boolean {
  return (
    typeof p.productCode === "string" && p.productCode.trim().length > 0 &&
    typeof p.name === "string" && p.name.trim().length > 0 &&
    typeof p.productType === "string" && p.productType.trim().length > 0 &&
    typeof p.manufacturer === "string" && p.manufacturer.trim().length > 0
  );
}