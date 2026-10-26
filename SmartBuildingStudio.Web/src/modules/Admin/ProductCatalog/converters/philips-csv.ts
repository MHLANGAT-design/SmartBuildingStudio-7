// src/modules/Admin/ProductCatalog/converters/philips-csv.ts
//
// Philips CSV export → NormalizedProduct[].
//
// Parses wattage ("40W"), output current ("0.1-1.1A" → min/max A), and
// output voltage ("54V DC") to canonical units. Currents are stored as
// milliamps for consistency with the other converters.

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

function parseWattage(s: string): number {
  const m = s.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

function parseVoltage(s: string): number {
  const m = s.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

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

function extractDaliGeneration(protocol: string): string {
  if (/dali\s*2/i.test(protocol)) return "DALI-2";
  if (/dali/i.test(protocol)) return "DALI";
  return "unknown";
}