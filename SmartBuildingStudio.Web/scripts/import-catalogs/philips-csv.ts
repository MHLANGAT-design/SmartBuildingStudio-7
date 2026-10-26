// scripts/import-catalogs/philips-csv.ts
//
// Philips CSV export → NormalizedProduct[].
//
// The Philips B2B portal exports products as CSV with these columns:
//   Product_ID, Model_Name, Type, Wattage, Output_Current,
//   Output_Voltage, Protocol, Application
//
// Differences from the JSON API shape:
//   - Wattage is "40W" (string with unit) — parse to number
//   - Output_Current is "0.1-1.1A" (range as string) — parse to min/max
//   - Output_Voltage is "54V DC" (string with unit) — parse to number
//   - Protocol / Application are free-form strings
//   - No certifications, dimensions, or detailed electrical specs in the CSV
//
// Output current is in AMPS (e.g., "0.1-1.1A") and gets normalized
// to milliamps (100-1100 mA) so cross-vendor comparisons work.

import {
  ConvertResult,
  NormalizedProduct,
  isValidProduct,
} from "./lib/normalizeProduct";

/**
 * One row from the parsed CSV. All values arrive as strings.
 */
export interface PhilipsCsvRow {
  Product_ID: string;
  Model_Name: string;
  Type: string;                  // "Constant Voltage" | "Constant Current"
  Wattage: string;               // "40W"
  Output_Current: string;        // "0.1-1.1A" | "2.5A"
  Output_Voltage: string;        // "54V DC" | "24V DC"
  Protocol: string;              // "DALI 2.0 / SimpleSet"
  Application: string;           // "Office & Indoor Linear"
}

/** Parse "40W" → 40. Returns 0 if unparseable. */
function parseWattage(s: string): number {
  const m = s.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

/** Parse "54V DC" → 54. Returns 0 if unparseable. */
function parseVoltage(s: string): number {
  const m = s.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

/**
 * Parse "0.1-1.1A" → { minA: 0.1, maxA: 1.1 }.
 * Parse "2.5A"     → { minA: 2.5, maxA: 2.5 }.
 * Returns null if unparseable.
 */
function parseCurrentRange(s: string): { minA: number; maxA: number } | null {
  const rangeMatch = s.match(/([\d.]+)\s*-\s*([\d.]+)/);
  if (rangeMatch) {
    return { minA: parseFloat(rangeMatch[1]), maxA: parseFloat(rangeMatch[2]) };
  }
  const singleMatch = s.match(/([\d.]+)/);
  if (singleMatch) {
    const v = parseFloat(singleMatch[1]);
    return { minA: v, maxA: v };
  }
  return null;
}

export function convertPhilipsCsv(raw: PhilipsCsvRow[]): ConvertResult {
  const products: NormalizedProduct[] = [];
  const skipped: ConvertResult["skipped"] = [];

  for (const r of raw) {
    const current = parseCurrentRange(r.Output_Current ?? "");

    const product: NormalizedProduct = {
      productCode: r.Product_ID,
      name: r.Model_Name,
      productType: "Driver",      // All Philips power supplies/drivers → Driver
      manufacturer: "Philips",
      wattage: parseWattage(r.Wattage),
      lumens: 0,
      cri: 0,
      colorTemperature: 0,
      specifications: {
        vendor: "Philips",
        // CSV doesn't carry a family, but Type + Application give context
        type: r.Type,                        // "Constant Voltage" | "Constant Current"
        application: r.Application,
        daliGeneration: extractDaliGeneration(r.Protocol),
        electrical: {
          // Always output as milliamps for consistency with Tridonic
          minCurrentMa: current ? Math.round(current.minA * 1000) : undefined,
          maxCurrentMa: current ? Math.round(current.maxA * 1000) : undefined,
          outputVoltageV: parseVoltage(r.Output_Voltage),
        },
        features: {
          protocol: r.Protocol,
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

/**
 * Extract the DALI generation from a free-form protocol string.
 * "DALI 2.0 / SimpleSet" → "DALI-2"
 * "DALI 2.0"             → "DALI-2"
 * "DALI"                 → "DALI"
 */
function extractDaliGeneration(protocol: string): string {
  if (/dali\s*2/i.test(protocol)) return "DALI-2";
  if (/dali/i.test(protocol)) return "DALI";
  return "unknown";
}