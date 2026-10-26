// src/modules/Admin/ProductCatalog/hooks/useProductImport.ts
//
// Parse → convert → dedupe → save pipeline.
//
// Import endpoint: API_ROUTES.PRODUCT_CATALOG_SERVICE.CATALOG.IMPORT + "/json"
// Backend response shape: { imported: number, failed: number, errors: { productCode, error }[] }
//
// CSV parsing is done with a self-contained RFC 4180 parser. csv-parse
// is a Node library that requires the Buffer polyfill, which does not
// work reliably in Vite's browser bundle. The hand-rolled parser has
// no external dependencies and handles the common cases:
//   • quoted fields with embedded commas
//   • quoted fields with embedded quotes (escaped as "")
//   • quoted fields with embedded newlines
//   • CRLF and LF line endings
//   • UTF-8 BOM stripping
//   • trailing empty lines

import { useCallback, useState } from "react";
import { API_ROUTES } from "@/Application/ApiRoutes";
import {
  ConverterEntry,
  ConvertResult,
  FileFormat,
  NormalizedProduct,
} from "../converters";
import { invalidateCatalog } from "./useProductCatalog";

export interface ImportPreview {
  products: NormalizedProduct[];
  skipped: ConvertResult["skipped"];
  existing: NormalizedProduct[];
  toImport: NormalizedProduct[];
  sourceLabel: string;
}

export interface ImportSaveResult {
  imported: number;
  failed: number;
  errors: Array<{ productCode: string; error: string }>;
  raw: unknown;
}

export interface UseProductImportReturn {
  preview: ImportPreview | null;
  parsing: boolean;
  saving: boolean;
  parseError: string | null;
  saveError: string | null;
  saveResult: ImportSaveResult | null;
  parseFile: (
    file: File,
    converter: ConverterEntry,
    format: FileFormat,
    existingCodes: Set<string>
  ) => Promise<void>;
  parseRaw: (
    raw: unknown[],
    converter: ConverterEntry,
    format: FileFormat,
    existingCodes: Set<string>
  ) => Promise<void>;
  save: (onSaved?: (r: ImportSaveResult) => void) => Promise<void>;
  reset: () => void;
}

// ─── Parsers ────────────────────────────────────────────────────────

function parseJson(text: string): unknown[] {
  const cleaned = text.replace(/^\uFEFF/, "");
  const parsed = JSON.parse(cleaned);
  return Array.isArray(parsed) ? parsed : [parsed];
}

/**
 * RFC 4180 CSV parser. Returns rows as objects keyed by the first row
 * (the header). Handles quoted fields with embedded commas, quotes,
 * and newlines. Skips empty trailing rows.
 */
function parseCsvText(text: string): Record<string, string>[] {
  const src = text.replace(/^\uFEFF/, "");

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < src.length) {
    const c = src[i];

    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }

    if (c === "\r") {
      i++;
      continue;
    }

    if (c === "\n") {
      row.push(field);
      if (row.some((v) => v.length > 0)) rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }

    field += c;
    i++;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((v) => v.length > 0)) rows.push(row);
  }

  if (rows.length < 2) return [];

  const headers = rows[0];
  const result: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const values = rows[r];
    const obj: Record<string, string> = {};
    for (let h = 0; h < headers.length; h++) {
      obj[headers[h]] = values[h] ?? "";
    }
    result.push(obj);
  }
  return result;
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useProductImport(): UseProductImportReturn {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<ImportSaveResult | null>(null);

  const runConversion = useCallback(
    (
      raw: unknown[],
      converter: ConverterEntry,
      format: FileFormat,
      existingCodes: Set<string>,
      sourceLabel: string
    ) => {
      const fn = format === "json" ? converter.convertJson : converter.convertCsv;
      if (!fn) {
        throw new Error(
          `Converter "${converter.label}" does not support ${format.toUpperCase()}`
        );
      }
      const result = fn(raw);

      const existing: NormalizedProduct[] = [];
      const toImport: NormalizedProduct[] = [];
      for (const p of result.products) {
        if (existingCodes.has(p.productCode)) existing.push(p);
        else toImport.push(p);
      }

      setPreview({
        products: result.products,
        skipped: result.skipped,
        existing,
        toImport,
        sourceLabel,
      });
    },
    []
  );

  const parseFile = useCallback(
    async (
      file: File,
      converter: ConverterEntry,
      format: FileFormat,
      existingCodes: Set<string>
    ) => {
      setParsing(true);
      setParseError(null);
      setSaveError(null);
      setSaveResult(null);
      try {
        const text = await file.text();
        const raw = format === "json" ? parseJson(text) : parseCsvText(text);
        runConversion(raw, converter, format, existingCodes, file.name);
      } catch (e: any) {
        setPreview(null);
        setParseError(e.message ?? "Failed to parse file");
      } finally {
        setParsing(false);
      }
    },
    [runConversion]
  );

  const parseRaw = useCallback(
    async (
      raw: unknown[],
      converter: ConverterEntry,
      format: FileFormat,
      existingCodes: Set<string>
    ) => {
      setParsing(true);
      setParseError(null);
      setSaveError(null);
      setSaveResult(null);
      try {
        runConversion(raw, converter, format, existingCodes, "<raw input>");
      } catch (e: any) {
        setPreview(null);
        setParseError(e.message ?? "Failed to convert");
      } finally {
        setParsing(false);
      }
    },
    [runConversion]
  );

  const save = useCallback(
    async (onSaved?: (r: ImportSaveResult) => void) => {
      if (!preview || preview.toImport.length === 0) return;
      setSaving(true);
      setSaveError(null);
      try {
        const url = `${API_ROUTES.PRODUCT_CATALOG_SERVICE.CATALOG.IMPORT}/json`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(preview.toImport),
        });

        const ct = res.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `Import endpoint returned non-JSON (${res.status} ${ct}). ` +
            `First 200 chars: ${text.slice(0, 200)}`
          );
        }

        const body = await res.json();
        if (!res.ok) {
          throw new Error(
            `Import failed: ${res.status} ${JSON.stringify(body)}`
          );
        }

        invalidateCatalog();

        const result: ImportSaveResult = {
          imported: typeof body?.imported === "number" ? body.imported : 0,
          failed: typeof body?.failed === "number" ? body.failed : 0,
          errors: Array.isArray(body?.errors) ? body.errors : [],
          raw: body,
        };
        setSaveResult(result);
        onSaved?.(result);
      } catch (e: any) {
        setSaveError(e.message ?? "Import failed");
      } finally {
        setSaving(false);
      }
    },
    [preview]
  );

  const reset = useCallback(() => {
    setPreview(null);
    setParsing(false);
    setSaving(false);
    setParseError(null);
    setSaveError(null);
    setSaveResult(null);
  }, []);

  return {
    preview,
    parsing,
    saving,
    parseError,
    saveError,
    saveResult,
    parseFile,
    parseRaw,
    save,
    reset,
  };
}