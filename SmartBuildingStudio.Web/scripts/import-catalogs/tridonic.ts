// scripts/import-catalogs/tridonic.ts
//
// Tridonic driver JSON → NormalizedProduct[].
//
// Field mapping:
//   article_number        → productCode
//   brand + series + code → name (Tridonic JSON has no `name`)
//   brand                 → manufacturer
//   series                → family
//   "Driver" (hardcoded)  → productType (Tridonic JSON doesn't declare it)
//   electrical_specs.max_wattage_w → wattage
//   everything else       → specifications (raw, no unit changes — already mA)

import {
  ConvertResult,
  NormalizedProduct,
  isValidProduct,
} from "./lib/normalizeProduct";

interface TridonicRaw {
  article_number: string;
  brand: string;
  series: string;
  dali_generation: string;
  device_type: string[];
  electrical_specs: {
    output_type: string;
    min_current_ma: number;
    max_current_ma: number;
    current_step_ma: number;
    max_wattage_w: number;
    forward_voltage_range_v: string;
  };
  supported_features: {
    lumDATA: boolean;
    nfc_programming: boolean;
    dimming_range_percent: number;
    dimming_technology: string;
  };
}

export function convertTridonic(raw: TridonicRaw[]): ConvertResult {
  const products: NormalizedProduct[] = [];
  const skipped: ConvertResult["skipped"] = [];

  for (const r of raw) {
    const product: NormalizedProduct = {
      productCode: r.article_number,
      name: `${r.brand} ${r.series} ${r.article_number}`,
      productType: "Driver",
      manufacturer: r.brand,
      family: r.series,
      wattage: r.electrical_specs.max_wattage_w,
      lumens: 0,
      cri: 0,
      colorTemperature: 0,
      specifications: {
        vendor: "Tridonic",
        daliGeneration: r.dali_generation,
        deviceTypes: r.device_type,
        electrical: {
          outputType: r.electrical_specs.output_type,
          minCurrentMa: r.electrical_specs.min_current_ma,
          maxCurrentMa: r.electrical_specs.max_current_ma,
          currentStepMa: r.electrical_specs.current_step_ma,
          maxWattageW: r.electrical_specs.max_wattage_w,
          forwardVoltageRangeV: r.electrical_specs.forward_voltage_range_v,
        },
        features: {
          lumData: r.supported_features.lumDATA,
          nfcProgramming: r.supported_features.nfc_programming,
          dimmingRangePercent: r.supported_features.dimming_range_percent,
          dimmingTechnology: r.supported_features.dimming_technology,
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