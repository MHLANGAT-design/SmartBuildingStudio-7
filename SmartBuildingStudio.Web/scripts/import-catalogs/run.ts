// scripts/import-catalogs/run.ts
//
// Usage:
//   npx tsx scripts/import-catalogs/run.ts tridonic ./tridonic.json
//   npx tsx scripts/import-catalogs/run.ts philips ./philips.json
//   npx tsx scripts/import-catalogs/run.ts osram ./osram.json
//
// Requires API_BASE env var (defaults to http://localhost:5000).

import fs from "fs";
import { convertTridonic } from "./tridonic";
import { convertPhilips } from "./philips";
import { convertOsram } from "./osram";
import { NormalizedProduct } from "./lib/normalizeProduct";

const API_BASE = process.env.API_BASE ?? "http://localhost:5000";

async function fetchExistingCodes(): Promise<Set<string>> {
  const res = await fetch(`${API_BASE}/api/productcatalog/products`);
  if (!res.ok) throw new Error(`GET /products failed: ${res.status}`);
  const list = (await res.json()) as Array<{ productCode: string }>;
  return new Set(list.map((p) => p.productCode));
}

async function postImport(products: NormalizedProduct[]): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/productcatalog/catalog/import/json`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(products),
    }
  );
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`import failed: ${res.status} ${JSON.stringify(body)}`);
  }
  console.log("Import result:", body);
}

async function main() {
  const [, , manufacturer, filePath] = process.argv;
  if (!manufacturer || !filePath) {
    console.error("Usage: run.ts <tridonic|philips|osram> <path-to-json>");
    process.exit(1);
  }

  // Read the vendor JSON, stripping a leading UTF-8 BOM if present.
  // PowerShell's `Out-File -Encoding utf8` writes one by default on
  // Windows, and JSON.parse rejects the BOM as an invalid token.
  const content = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const raw = JSON.parse(content);
  const input = Array.isArray(raw) ? raw : [raw];

  const converter =
    manufacturer === "tridonic" ? convertTridonic :
    manufacturer === "philips" ? convertPhilips :
    manufacturer === "osram" ? convertOsram :  
    null;

  if (!converter) {
    console.error(`Unknown manufacturer: ${manufacturer}`);
    process.exit(1);
  }

  const { products, skipped } = converter(input);
  console.log(`Converted ${products.length} products, skipped ${skipped.length}.`);
  if (skipped.length > 0) {
    console.warn("Skipped:", skipped);
  }

  // Pre-dedupe: skip items already in the catalog. Re-import with
  // updates requires an upsert endpoint (future work).
  const existing = await fetchExistingCodes();
  const toImport = products.filter((p) => !existing.has(p.productCode));
  const alreadyPresent = products.length - toImport.length;
  console.log(`Already in catalog: ${alreadyPresent}. Importing ${toImport.length}.`);

  if (toImport.length === 0) return;
  await postImport(toImport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});