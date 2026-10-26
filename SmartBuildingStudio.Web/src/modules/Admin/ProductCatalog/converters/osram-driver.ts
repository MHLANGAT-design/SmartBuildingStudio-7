// src/modules/Admin/ProductCatalog/converters/osram-driver.ts
//
// Osram OPTOTRONIC DALI driver JSON → NormalizedProduct[].
//
// Shape: product_id, product_family, ean_code, category, sub_category,
// interface_type, electrical_specifications (nested), capabilities,
// physical_properties, environmental_lifespan.
//
// Canonical conversion:
//   - wattage → W numeric (from maximum_output_power)
//   - output current → mA (already mA in source)
//   - voltage ranges → { min, max }
//
// productType is "Driver" — the exact string Enum.TryParse accepts
// against the backend's ProductType enum. See CatalogImportController.

import {
  ConvertResult,
  NormalizedProduct,
  isValidProduct,
} from "./normalizeProduct";
import { parseNumber, parseRange } from "./lib/parsers";

interface OsramDriverRaw {
  brand: string;
  product_family?: string;
  product_id: string;
  ean_code?: string;
  category: string;
  sub_category?: string;
  interface_type?: string;
  electrical_specifications: {
    nominal_input_voltage?: string;
    mains_frequency?: string;
    standby_power_consumption?: string;
    maximum_output_power?: string;
    output_voltage_range?: string;
    output_current_range?: string;
    default_output_current?: string;
    output_ripple_current?: string;
  };
  capabilities?: Record<string, unknown>;
  physical_properties?: Record<string, unknown>;
  environmental_lifespan?: Record<string, unknown>;
}

const MANUFACTURER = "Osram"; // adjust casing if catalog uses a different form

export function convertOsramDriver(raw: OsramDriverRaw[]): ConvertResult {
  const products: NormalizedProduct[] = [];
  const skipped: ConvertResult["skipped"] = [];

  for (const r of raw) {
    if (!r.product_id || !r.brand) {
      skipped.push({ reason: "missing product_id or brand", raw: r });
      continue;
    }

    const elec = r.electrical_specifications ?? {};
    const vRange = parseRange(elec.output_voltage_range);
    const iRange = parseRange(elec.output_current_range);

    const product: NormalizedProduct = {
      productCode: r.product_id,
      name: r.product_id,
      productType: "Driver",
      manufacturer: MANUFACTURER,
      family: r.product_family,
      wattage: parseNumber(elec.maximum_output_power),
      specifications: {
        vendor: "Osram",
        ean: r.ean_code,
        category: r.category,
        subCategory: r.sub_category,
        daliGeneration: r.interface_type,
        electrical: {
          inputVoltageV: elec.nominal_input_voltage,
          mainsFrequency: elec.mains_frequency,
          standbyPowerW: parseNumber(elec.standby_power_consumption),
          outputPowerW: parseNumber(elec.maximum_output_power),
          outputVoltageRangeV: vRange,
          outputCurrentRangeMa: iRange,
          defaultOutputCurrentMa: parseNumber(elec.default_output_current),
          outputRipplePercent: parseNumber(elec.output_ripple_current),
        },
        capabilities: r.capabilities ?? {},
        physical: r.physical_properties ?? {},
        lifespan: r.environmental_lifespan ?? {},
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