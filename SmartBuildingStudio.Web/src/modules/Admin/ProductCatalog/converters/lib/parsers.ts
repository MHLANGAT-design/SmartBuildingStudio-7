// src/modules/Admin/ProductCatalog/converters/lib/parsers.ts
//
// Parsing helpers for converters whose source data has units or ranges
// as strings:
//   "18 W"            → 18
//   "< 0.15 W"        → 0.15
//   "7.5 - 54.0 V"    → { min: 7.5, max: 54.0, raw: "7.5 - 54.0 V" }
//   "150 - 1050 mA"   → { min: 150, max: 1050, raw: "150 - 1050 mA" }
//   "> 80"            → 80
//   "220-240 V"       → { min: 220, max: 240, raw: "220-240 V" }

export function parseNumber(s: string | undefined | null): number | undefined {
  if (s == null) return undefined;
  const m = String(s).match(/-?\d+(?:\.\d+)?/);
  if (!m) return undefined;
  const n = parseFloat(m[0]);
  return Number.isFinite(n) ? n : undefined;
}

export interface ParsedRange {
  min?: number;
  max?: number;
  raw: string;
}

export function parseRange(
  s: string | undefined | null
): ParsedRange | undefined {
  if (s == null) return undefined;
  const str = String(s);
  const nums = str.match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) return undefined;
  if (nums.length === 1) {
    const v = parseFloat(nums[0]);
    return { min: v, max: v, raw: str };
  }
  return {
    min: parseFloat(nums[0]),
    max: parseFloat(nums[nums.length - 1]),
    raw: str,
  };
}