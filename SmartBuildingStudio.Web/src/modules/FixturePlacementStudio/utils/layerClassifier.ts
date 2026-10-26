// src/modules/FixturePlacementStudio/utils/layerClassifier.ts
//
// Classify a raw DXF layer name into a semantic category.
//
// The importer gives us two signals per element:
//   - `type`          — its own classification ('wall' | 'door' | 'window' | 'room')
//   - `originalLayer` — the raw DXF layer name
//
// We trust `type` for door / window / room. For everything else (the
// importer's generic 'wall' bucket), the layer name tells us what the
// element really is.
//
// Pattern matching is high-confidence when it hits. When it doesn't,
// the element is 'unknown' and excluded from topology counts. A blank
// layer name is also 'unknown' — the absence of information is not
// evidence of a wall.

export type LayerCategory =
  | 'wall'
  | 'door'
  | 'window'
  | 'room'
  | 'stair'
  | 'handrail'
  | 'detail'
  | 'furniture'
  | 'unknown';

/**
 * Specific exclusions — these are NOT walls even if the layer name
 * also contains a wall-adjacent keyword. Applied first so that e.g.
 * "A-DETL-WALL" classifies as detail, not wall.
 */
const EXCLUSION_PATTERNS: Array<{ regex: RegExp; category: LayerCategory }> = [
  { regex: /DETAIL|DETL/i,       category: 'detail' },
  { regex: /STAIR|STRS|STEPS/i,  category: 'stair' },
  { regex: /HANDRAIL|HRAL/i,     category: 'handrail' },
  { regex: /FURNITURE|FURN/i,    category: 'furniture' },
];

/**
 * Door and window patterns — apply only when the importer's type is
 * not already door/window/room. Catches doors/windows that the
 * importer missed.
 */
const DOOR_PATTERN = /DOOR|DR[-_ ]|[-_]DR$/i;
const WINDOW_PATTERN = /WINDOW|WIN[-_ ]|GLAZ|WDW|SASH|GLAZING/i;

/**
 * Wall-adjacent patterns. Real walls, columns, and structural
 * bearings all count as walls.
 */
const WALL_PATTERN =
  /WALL|WALLING|COLUMN|COLS|STRUCTURAL|STRUCT|BEARING|BEAM/i;

/**
 * Classify a layer given the importer's type.
 */
export function classifyLayer(
  layerName: string | undefined | null,
  importerType: string | undefined | null
): LayerCategory {
  const t = String(importerType ?? '').toLowerCase();
  if (t === 'door') return 'door';
  if (t === 'window') return 'window';
  if (t === 'room') return 'room';

  const name = String(layerName ?? '');
  if (!name) return 'unknown';

  for (const { regex, category } of EXCLUSION_PATTERNS) {
    if (regex.test(name)) return category;
  }

  if (DOOR_PATTERN.test(name)) return 'door';
  if (WINDOW_PATTERN.test(name)) return 'window';

  if (WALL_PATTERN.test(name)) return 'wall';

  return 'unknown';
}

/**
 * Categories that participate in room-boundary topology. Everything
 * else (detail, furniture, unknown) is rendered but not counted.
 */
export function isTopologyCategory(category: LayerCategory): boolean {
  return (
    category === 'wall' ||
    category === 'door' ||
    category === 'window' ||
    category === 'stair' ||
    category === 'handrail' ||
    category === 'room'
  );
}

export default classifyLayer;