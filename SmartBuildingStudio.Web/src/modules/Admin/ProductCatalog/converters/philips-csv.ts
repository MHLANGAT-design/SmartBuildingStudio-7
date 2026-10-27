// src/modules/Admin/ProductCatalog/converters/philips-csv.ts
//
// Philips CSV export → NormalizedProduct[].
//
// Guards every parse* helper against undefined / non-string input so
// that feeding this converter the wrong CSV shape (e.g. a Tridonic
// catalog) skips rows instead of crashing on s.match(...).

import {
  ConvertResult,
  NormalizedProduct,
  isValidProduct,
} from "./normalizeProduct";

export interface PhilipsCsvRow {
  Product_ID: string;
  Model_Name: string;
  Type: string;
  Wattage: string;
  Output_Current: string;
  Output_Voltage: string;
  Protocol: string;
  Application: string;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function parseWattage(s: unknown): number {
  const str = asString(s);
  const m = str.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

function parseVoltage(s: unknown): number {
  const str = asString(s);
  const m = str.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

function parseCurrentRange(s: unknown): { minA: number; maxA: number } | null {
  const str = asString(s);
  if (!str) return null;
  const rangeMatch = str.match(/([\d.]+)\s*-\s*([\d.]+)/);
  if (rangeMatch) {
    return { minA: parseFloat(rangeMatch[1]), maxA: parseFloat(rangeMatch[2]) };
  }
  const singleMatch = str.match(/([\d.]+)/);
  if (singleMatch) {
    const v = parseFloat(singleMatch[1]);
    return { minA: v, maxA: v };
  }
  return null;
}

function extractDaliGeneration(protocol: unknown): string {
  const str = asString(protocol);
  if (/dali\s*2/i.test(str)) return "DALI-2";
  if (/dali/i.test(str)) return "DALI";
  return "unknown";
}

export function convertPhilipsCsv(raw: PhilipsCsvRow[]): ConvertResult {
  const products: NormalizedProduct[] = [];
  const skipped: ConvertResult["skipped"] = [];

  for (const r of raw) {
    const current = parseCurrentRange(r.Output_Current);

    const product: NormalizedProduct = {
      productCode: r.Product_ID,
      name: r.Model_Name,
      productType: "Driver",
      manufacturer: "Philips",
      wattage: parseWattage(r.Wattage),
      lumens: 0,
      cri: 0,
      colorTemperature: 0,
      specifications: {
        vendor: "Philips",
        type: r.Type,
        application: r.Application,
        daliGeneration: extractDaliGeneration(r.Protocol),
        electrical: {
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