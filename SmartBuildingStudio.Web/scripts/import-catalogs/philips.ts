// scripts/import-catalogs/philips.ts
//
// Philips Xitanium driver JSON → NormalizedProduct[].
//
// Field mapping:
//   productId             → productCode
//   productName           → name
//   "Philips"             → manufacturer (hardcoded)
//   family                → family
//   "Driver"              → productType
//   technicalData.outputPowerW → wattage
//   amps                  → milliamps (×1000) for canonical units
//   everything else       → specifications

import {
  ConvertResult,
  NormalizedProduct,
  isValidProduct,
} from "./lib/normalizeProduct";

interface PhilipsRaw {
  productId: string;
  productName: string;
  family?: string;
  range?: string;
  daliVersion?: string;
  technicalData: {
    outputPowerW: number;
    outputCurrentMinA?: number;
    outputCurrentMaxA?: number;
    outputVoltageMaxV?: number;
    inputVoltageV?: string;
  };
  certifications?: string[];
  features?: {
    programmable?: boolean;
    dimmingProtocol?: string;
    dimmingRange?: string;
  };
}

export function convertPhilips(raw: PhilipsRaw[]): ConvertResult {
  const products: NormalizedProduct[] = [];
  const skipped: ConvertResult["skipped"] = [];

  for (const r of raw) {
    // Unit normalization: Philips gives amps; we store milliamps
    // canonically so downstream comparisons with Tridonic work.
    const minCurrentMa =
      r.technicalData.outputCurrentMinA != null
        ? Math.round(r.technicalData.outputCurrentMinA * 1000)
        : undefined;
    const maxCurrentMa =
      r.technicalData.outputCurrentMaxA != null
        ? Math.round(r.technicalData.outputCurrentMaxA * 1000)
        : undefined;

    const product: NormalizedProduct = {
      productCode: r.productId,
      name: r.productName,
      productType: "Driver",
      manufacturer: "Philips",
      family: r.family,
      wattage: r.technicalData.outputPowerW,
      lumens: 0,
      cri: 0,
      colorTemperature: 0,
      specifications: {
        vendor: "Philips",
        family: r.family,
        range: r.range,
        daliGeneration: r.daliVersion,
        electrical: {
          outputPowerW: r.technicalData.outputPowerW,
          minCurrentMa,
          maxCurrentMa,
          outputVoltageMaxV: r.technicalData.outputVoltageMaxV,
          inputVoltageV: r.technicalData.inputVoltageV,
        },
        certifications: r.certifications ?? [],
        features: r.features ?? {},
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