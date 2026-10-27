// src/modules/Admin/ProductCatalog/converters/index.ts
//
// Registry of all manufacturer converters. The import dialogs use this
// to look up the right converter based on the manufacturer + file
// format selected by the user.
//
// Philips is split into philips (JSON) and philips-csv (CSV) so the
// user picks the shape they're uploading. Tridonic follows the same
// pattern: tridonic (JSON) and tridonic-csv (CSV). No change is needed
// in the import dialog — its dropdown is generated from this array.

import type { ConvertResult } from "./normalizeProduct";
import { convertTridonic } from "./tridonic";
import { convertTridonicCsv } from "./tridonic-csv";
import { convertPhilips } from "./philips";
import { convertPhilipsCsv } from "./philips-csv";
import { convertOsramDriver } from "./osram-driver";
import { convertOsramLuminaire } from "./osram-luminaire";

export type FileFormat = "json" | "csv";

export interface ConverterEntry {
  id: string;
  label: string;
  formats: FileFormat[];
  convertJson?: (raw: unknown[]) => ConvertResult;
  convertCsv?: (raw: unknown[]) => ConvertResult;
}

export const CONVERTERS: ConverterEntry[] = [
  {
    id: "tridonic",
    label: "Tridonic (JSON)",
    formats: ["json"],
    convertJson: (raw) => convertTridonic(raw as any[]),
  },
  {
    id: "tridonic-csv",
    label: "Tridonic (CSV)",
    formats: ["csv"],
    convertCsv: (raw) => convertTridonicCsv(raw as any[]),
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