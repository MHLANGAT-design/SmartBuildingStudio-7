// src/modules/Admin/ProductCatalog/converters/osram-luminaire.ts
//
// Osram LINEAR LED luminaire JSON → NormalizedProduct[].
//
// Shape: product_id, product_family, ean_code, category, sub_category,
// application[], optical_specifications (nested), electrical_data,
// physical_properties, performance.
//
// Canonical conversion:
//   - wattage → W numeric
//   - lumens → lm numeric
//   - CRI → int ("> 80" → 80)
//   - color temp → K numeric
//
// productType is "Luminaire" — exact string Enum.TryParse accepts.
// Manufacturer strips the "/ LEDVANCE" suffix if present so all Osram
// products group under one row.

import {
  ConvertResult,
  NormalizedProduct,
  isValidProduct,
} from "./normalizeProduct";
import { parseNumber } from "./lib/parsers";

interface OsramLuminaireRaw {
  brand: string;
  product_family?: string;
  product_id: string;
  ean_code?: string;
  category: string;
  sub_category?: string;
  application?: string[];
  optical_specifications: {
    nominal_wattage?: string;
    luminous_flux?: string;
    luminous_efficacy?: string;
    color_temperature?: string;
    light_color?: string;
    color_rendering_index_ra?: string;
    beam_angle?: string;
  };
  electrical_data?: Record<string, unknown>;
  physical_properties?: Record<string, unknown>;
  performance?: Record<string, unknown>;
}

const MANUFACTURER = "Osram"; // adjust casing if catalog uses a different form

export function convertOsramLuminaire(raw: OsramLuminaireRaw[]): ConvertResult {
  const products: NormalizedProduct[] = [];
  const skipped: ConvertResult["skipped"] = [];

  for (const r of raw) {
    if (!r.product_id || !r.brand) {
      skipped.push({ reason: "missing product_id or brand", raw: r });
      continue;
    }

    const optic = r.optical_specifications ?? {};

    const product: NormalizedProduct = {
      productCode: r.product_id,
      name: r.product_id,
      productType: "Luminaire",
      manufacturer: MANUFACTURER,
      family: r.product_family,
      wattage: parseNumber(optic.nominal_wattage),
      lumens: parseNumber(optic.luminous_flux),
      cri: parseNumber(optic.color_rendering_index_ra),
      colorTemperature: parseNumber(optic.color_temperature),
      specifications: {
        vendor: "Osram",
        ean: r.ean_code,
        category: r.category,
        subCategory: r.sub_category,
        application: r.application ?? [],
        optical: {
          luminousEfficacy: optic.luminous_efficacy,
          lightColor: optic.light_color,
          beamAngle: optic.beam_angle,
        },
        electrical: r.electrical_data ?? {},
        physical: r.physical_properties ?? {},
        performance: r.performance ?? {},
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