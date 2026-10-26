// WallCenterlineExtractor.ts
//
// Normalizes raw wall segments to logical walls with a centerline and a
// thickness. In this codebase, walls are exported from the source drawing
// as individual segments that already carry a `thickness` field — they are
// NOT two parallel face lines. So the extractor's job is:
//
//   1. Coerce start/end coordinates into a consistent shape.
//   2. Drop degenerate segments.
//   3. Preserve thickness on the output so downstream code (snapping,
//      hit-testing, rendering) can rely on it.
//
// If a future importer starts emitting true face pairs, add a pairing pass
// here — but gate it on the presence of a face-pair marker, not on a gap
// threshold, so single-segment walls are never mis-paired.

export interface ExtractedWall {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
  sourceIds: string[];
}

interface WallLine {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number;
  thickness: number;
}

const MIN_SEGMENT_LENGTH = 1e-3;
const DEFAULT_THICKNESS = 120;

function toLine(w: any): WallLine | null {
  const sx = Number(w.startX ?? w.start?.x ?? NaN);
  const sy = Number(w.startY ?? w.start?.y ?? NaN);
  const ex = Number(w.endX   ?? w.end?.x   ?? NaN);
  const ey = Number(w.endY   ?? w.end?.y   ?? NaN);
  if (![sx, sy, ex, ey].every(isFinite)) return null;

  const length = Math.hypot(ex - sx, ey - sy);
  if (length < MIN_SEGMENT_LENGTH) return null;

  const rawThickness = Number(w.thickness ?? w.Thickness ?? NaN);
  const thickness = isFinite(rawThickness) && rawThickness > 0
    ? rawThickness
    : DEFAULT_THICKNESS;

  return {
    id: String(w.id ?? w.Id ?? ''),
    startX: sx,
    startY: sy,
    endX: ex,
    endY: ey,
    length,
    thickness,
  };
}

export function extractWallCenterlines(rawWalls: any[]): ExtractedWall[] {
  const out: ExtractedWall[] = [];
  const seen = new Set<string>();

  for (const w of rawWalls) {
    const l = toLine(w);
    if (!l) continue;
    if (!l.id || seen.has(l.id)) continue;
    seen.add(l.id);

    out.push({
      id: l.id,
      startX: l.startX,
      startY: l.startY,
      endX: l.endX,
      endY: l.endY,
      thickness: l.thickness,
      sourceIds: [l.id],
    });
  }

  return out;
}