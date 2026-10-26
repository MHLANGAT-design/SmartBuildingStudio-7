// src/modules/FloorPlanDesigner/Utils/semanticCounts.ts
//
// Shared counting helper for the FPD panels.
//
// The DXF import produces two parallel representations of the same
// content:
//
//   document.elements  — the flat render stream. Doors and windows
//                        drawn as multi-segment blocks contribute
//                        one element per segment (779 door segments
//                        for 41 physical doors, for example).
//
//   document.doors /   — the grouped semantic model. One entry per
//   .windows / .walls     physical door / window / wall.
//
// Panels that show inventory counts want the second number. Rendering,
// hit-testing, and the layer visibility flags still operate on the
// first — nothing here changes that.
//
// The fallback keeps old documents working: if a document was imported
// before grouping existed, the semantic collections are empty and the
// element count is the honest answer.

/**
 * Count for a semantic category.
 *
 * Prefers the grouped collection when it has content. Falls back to the
 * flat element count otherwise.
 */
export function countSemantic(
  semantic: any[] | undefined,
  elementFallback: number
): number {
  return Array.isArray(semantic) && semantic.length > 0
    ? semantic.length
    : elementFallback;
}

/**
 * Count of a specific element bucket from the flat `elements` array.
 * Thin wrapper around the classify + filter pattern used across panels.
 */
export function countElementsByType(
  elements: any[] | undefined,
  predicate: (el: any) => boolean
): number {
  if (!Array.isArray(elements)) return 0;
  let n = 0;
  for (const el of elements) {
    if (predicate(el)) n++;
  }
  return n;
}