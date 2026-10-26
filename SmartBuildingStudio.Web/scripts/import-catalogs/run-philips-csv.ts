// scripts/import-catalogs/run-philips-csv.ts
//
// Usage: npx tsx scripts/import-catalogs/run-philips-csv.ts philips-catalog.csv

import fs from "fs";
import { parse as parseCsv } from "csv-parse/sync";
import { convertPhilipsCsv, PhilipsCsvRow } from "./philips-csv";
import { NormalizedProduct } from "./lib/normalizeProduct";

const API_BASE = process.env.API_BASE ?? "http://localhost:5000";

async function fetchExistingCodes(): Promise<Set<string>> {
  const res = await fetch(`${API_BASE}/api/productcatalog/products`);
  if (!res.ok) throw new Error(`GET /products failed: ${res.status}`);
  const list = (await res.json()) as Array<{ productCode: string }>;
  return new Set(list.map((p) => p.productCode));
}

async function postImport(products: NormalizedProduct[]): Promise<void> {
  const res = await fetch(`${API_BASE}/api/productcatalog/catalog/import/json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(products),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`import failed: ${res.status} ${JSON.stringify(body)}`);
  console.log("Import result:", body);
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: run-philips-csv.ts <file.csv>");
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(content, { columns: true, skip_empty_lines: true }) as PhilipsCsvRow[];

  const { products, skipped } = convertPhilipsCsv(rows);
  console.log(`Converted ${products.length} products, skipped ${skipped.length}.`);
  if (skipped.length > 0) console.warn("Skipped:", skipped);

  const existing = await fetchExistingCodes();
  const toImport = products.filter((p) => !existing.has(p.productCode));
  const alreadyPresent = products.length - toImport.length;
  console.log(`Already in catalog: ${alreadyPresent}. Importing ${toImport.length}.`);

  if (toImport.length === 0) return;
  await postImport(toImport);
}

main().catch((err) => { console.error(err); process.exit(1); });