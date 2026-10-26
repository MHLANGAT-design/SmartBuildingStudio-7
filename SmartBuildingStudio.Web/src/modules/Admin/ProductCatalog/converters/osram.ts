// src/modules/Admin/ProductCatalog/converters/osram.ts
//
// Osram driver JSON → NormalizedProduct[].
// Unit normalization: amps → milliamps (×1000).

import {
  ConvertResult,
  NormalizedProduct,
  isValidProduct,
} from "./normalizeProduct";

interface OsramRaw {
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

export function convertOsram(raw: OsramRaw[]): ConvertResult {
  const products: NormalizedProduct[] = [];
  const skipped: ConvertResult["skipped"] = [];

  for (const r of raw) {
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
      manufacturer: "Osram",
      family: r.family,
      wattage: r.technicalData.outputPowerW,
      lumens: 0,
      cri: 0,
      colorTemperature: 0,
      specifications: {
        vendor: "Osram",
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