// src/modules/Admin/ProductCatalog/converters/tridonic-csv.ts
//
// Tridonic CSV catalog (Downlights + LED Luminaire Modules) → NormalizedProduct[].
//
// Supports two schemas:
//   1. Downlights (Series/Engine Name, Article Number/Type, etc.)
//   2. LED Modules (Series/Family Name, Article Number (Sample), etc.)
//
// Every parse helper guards against missing columns so a schema
// mismatch skips the row instead of crashing on s.match(...).

import {
  ConvertResult,
  NormalizedProduct,
  isValidProduct,
} from "./normalizeProduct";

// Union of columns from both Tridonic catalog styles.
export interface TridonicCsvRow {
  // Downlight schema
  "Series/Engine Name"?: string;
  "Article Number/Type"?: string;
  "Luminous Flux (lm)"?: string;
  "Color Temperature (K)"?: string;
  "CRI"?: string;
  "Efficacy (lm/W)"?: string;
  "Dimming Interface"?: string;
  "Cut-out Diameter (mm)"?: string;

  // LED Luminaire Module schema
  "Series/Family Name"?: string;
  "Product Type / Shape"?: string;
  "Article Number (Sample)"?: string;
  "Luminous Flux Range (lm)"?: string;
  "Max Efficacy (lm/W)"?: string;
  "Intended Luminaire Application"?: string;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function firstAndLastNumber(
  s: unknown
): { min: number; max: number } | undefined {
  const str = asString(s);
  if (!str) return undefined;
  const nums = str.match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) return undefined;
  return {
    min: parseFloat(nums[0]),
    max: parseFloat(nums[nums.length - 1]),
  };
}

function extractDaliSupport(dimmingInterface: unknown): {
  isDali: boolean;
  isDali2: boolean;
  isDaliDt8: boolean;
} {
  const s = asString(dimmingInterface).toLowerCase();
  return {
    isDali: /dali/.test(s),
    isDali2: /dali[-\s]?2/.test(s),
    isDaliDt8: /dt8/.test(s),
  };
}

export function convertTridonicCsv(raw: TridonicCsvRow[]): ConvertResult {
  const products: NormalizedProduct[] = [];
  const skipped: ConvertResult["skipped"] = [];

  for (const r of raw) {
    // ── 1. Resolve common fields (aliased across both schemas) ────────
    const productCode = asString(
      r["Article Number/Type"] ?? r["Article Number (Sample)"]
    ).trim();

    const name = asString(
      r["Series/Engine Name"] ?? r["Series/Family Name"]
    ).trim();

    if (!productCode || !name) {
      skipped.push({ reason: "missing required field", raw: r });
      continue;
    }

    // ── 2. Resolve metrics ────────────────────────────────────────────
    const flux = firstAndLastNumber(
      r["Luminous Flux (lm)"] ?? r["Luminous Flux Range (lm)"]
    );
    
    const cct = firstAndLastNumber(r["Color Temperature (K)"]);
    const criRange = firstAndLastNumber(r["CRI"]);
    
    const efficacy = firstAndLastNumber(
      r["Efficacy (lm/W)"] ?? r["Max Efficacy (lm/W)"]
    );

    const cutout = firstAndLastNumber(r["Cut-out Diameter (mm)"]);
    const daliSupport = extractDaliSupport(r["Dimming Interface"]);

    // ── 3. Assemble product ───────────────────────────────────────────
    const product: NormalizedProduct = {
      productCode,
      name,
      productType: "Luminaire",
      manufacturer: "Tridonic",
      // Store family if available (falls back to the full series name)
      family: asString(r["Product Type / Shape"]).trim() || name,
      wattage: 0,
      lumens: flux ? Math.round((flux.min + flux.max) / 2) : 0,
      cri: criRange ? Math.round((criRange.min + criRange.max) / 2) : 0,
      colorTemperature: cct ? Math.round((cct.min + cct.max) / 2) : 0,
      specifications: {
        vendor: "Tridonic",
        dimmingInterface: asString(r["Dimming Interface"]),
        application: asString(r["Intended Luminaire Application"]),
        daliGeneration: daliSupport.isDali2
          ? "DALI-2"
          : daliSupport.isDali
          ? "DALI"
          : "unknown",
        features: {
          isDali: daliSupport.isDali,
          isDali2: daliSupport.isDali2,
          isDaliDt8: daliSupport.isDaliDt8,
        },
        luminaire: {
          luminousFluxLm: flux ? { min: flux.min, max: flux.max } : undefined,
          colorTemperatureK: cct ? { min: cct.min, max: cct.max } : undefined,
          cri: criRange ? { min: criRange.min, max: criRange.max } : undefined,
          efficacyLmW: efficacy ? { min: efficacy.min, max: efficacy.max } : undefined,
          cutoutDiameterMm: cutout ? { min: cutout.min, max: cutout.max } : undefined,
        },
      },
    };

    if (!isValidProduct(product)) {
      skipped.push({ reason: "missing required field", raw: r });
      continue;
    }
    products.push(product);
  }

  return { products, skipped };
}