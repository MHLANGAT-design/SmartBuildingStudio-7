// src/modules/Admin/ProductCatalog/converters/index.ts
//
// Registry of all manufacturer converters. The import dialogs use this
// to look up the right converter based on the manufacturer + file
// format selected by the user.
//
// To add a new manufacturer: add an entry to CONVERTERS and export the
// converter from its own file. No other change is needed — the UI
// dropdowns are generated from this registry.
//
// Note on Osram: there are two distinct product shapes (drivers and
// luminaires), each with its own converter. The automotive lighting
// shape (headlight lamps) is intentionally not registered — that
// product category is out of scope for this catalog.

import type { ConvertResult } from "./normalizeProduct";
import { convertTridonic } from "./tridonic";
import { convertPhilips } from "./philips";
import { convertPhilipsCsv } from "./philips-csv";
import { convertOsramDriver } from "./osram-driver";
import { convertOsramLuminaire } from "./osram-luminaire";

export type FileFormat = "json" | "csv";

export interface ConverterEntry {
  /** Stable identifier used in URLs, localStorage, and dropdowns. */
  id: string;
  /** Human-readable display name for the dropdown. */
  label: string;
  /** Which file formats this manufacturer supports. */
  formats: FileFormat[];
  /** The conversion function for JSON format (if supported). */
  convertJson?: (raw: unknown[]) => ConvertResult;
  /** The conversion function for CSV format (if supported). */
  convertCsv?: (raw: unknown[]) => ConvertResult;
}

export const CONVERTERS: ConverterEntry[] = [
  {
    id: "tridonic",
    label: "Tridonic",
    formats: ["json"],
    convertJson: (raw) => convertTridonic(raw as any[]),
  },
  {
    id: "philips",
    label: "Philips (JSON)",
    formats: ["json"],
    convertJson: (raw) => convertPhilips(raw as any[]),
  },
  {
    id: "philips-csv",
    label: "Philips (CSV)",
    formats: ["csv"],
    convertCsv: (raw) => convertPhilipsCsv(raw as any[]),
  },
  {
    id: "osram-driver",
    label: "Osram (Driver)",
    formats: ["json"],
    convertJson: (raw) => convertOsramDriver(raw as any[]),
  },
  {
    id: "osram-luminaire",
    label: "Osram (Luminaire)",
    formats: ["json"],
    convertJson: (raw) => convertOsramLuminaire(raw as any[]),
  },
];

export function getConverter(id: string): ConverterEntry | undefined {
  return CONVERTERS.find((c) => c.id === id);
}

export type { ConvertResult, NormalizedProduct } from "./normalizeProduct";
export { isValidProduct } from "./normalizeProduct";