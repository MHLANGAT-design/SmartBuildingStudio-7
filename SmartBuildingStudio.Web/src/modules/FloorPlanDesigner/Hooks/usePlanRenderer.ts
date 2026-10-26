// src/modules/FloorPlanDesigner/Hooks/usePlanRenderer.ts
//
// Single renderer for every source shape the canvas can receive.
//
// Producers of a plan (all converge on { elements: [...] }):
//   • The database load path — transformDbSchemaToCanvasSchema builds
//     elements from walls / doors / windows / rooms.
//   • The DWG import path — the import converts every parsed entity
//     into an element with a `type` and `points`.
//   • FixturePlacementStudio's DrawingDocument — has already been
//     shaped into elements by its own load pipeline.
//
// Since every producer's output is { elements: [...] }, the canvas
// does not need to know which producer ran. This hook accepts any of
// them and returns a canonical plan.
//
// ── Memoization strategy ──────────────────────────────────────────────
//
// The memo is keyed on a stable content hash of the source document,
// not on the source object reference. Redux produces a new document
// object on every setDocument dispatch — even when the geometry is
// identical — so keying on `source` alone forced a full plan rebuild
// on every write and trapped the render effect in a cancel/reschedule
// loop until the writes settled.
//
// The hash covers:
//   - id                  which document
//   - collection counts   added/removed walls, doors, windows, rooms
//   - last id per pool    append-heavy edits (new item → new id)
//   - room contents       name, targetLux, primaryGroup — the fields
//                         the canvas renders as room labels. Editing
//                         them must bust the memo, because the item
//                         id and collection count stay the same.
//
// If a new field starts being rendered on the canvas, add it to the
// fingerprint so edits to it repaint.

import { useMemo } from 'react';
import { transformDbSchemaToCanvasSchema } from '@/modules/FloorPlanDesigner/Utils/DatabaseToCanvasTransformer';
import type { ArchitecturalPlan } from '@/modules/FloorPlanDesigner/core/types';

const lastId = (arr: any): string => {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  const item = arr[arr.length - 1];
  return String(item?.id ?? item?.Id ?? '');
};

/**
 * Fingerprint a list of items by the fields the canvas actually draws.
 * `fields` is the ordered list of property names to extract; joined
 * with `:` per item and `,` between items. Missing fields become ''.
 *
 * Order matters for cache key stability — items must be in the same
 * order every time. Redux arrays are append-ordered, so this is safe.
 */
const fingerprint = (
  arr: any,
  fields: string[],
  idField: string = 'id'
): string => {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  return arr
    .map((item) => {
      if (!item || typeof item !== 'object') return '';
      const id = String(item[idField] ?? item.Id ?? '');
      const vals = fields.map((f) => {
        const v = (item as any)[f];
        return v === undefined || v === null ? '' : String(v);
      });
      return [id, ...vals].join(':');
    })
    .join(',');
};

export const usePlanRenderer = (
  source: any,
  layers: Record<string, boolean>
): ArchitecturalPlan => {
  // Room contents drive the canvas labels. Fingerprint the fields the
  // render loop draws: name, targetLux, primaryGroup. Also the point
  // count, in case a room is reshaped without changing its id.
  const roomsFingerprint = fingerprint(
    source?.rooms,
    ['name', 'targetLux', 'primaryGroup', 'points']
  );

  // Walls: only the geometry matters for rendering; if thickness ever
  // changes the visual, add 'thickness' to the list.
  const wallsFingerprint = fingerprint(source?.walls, ['thickness', 'material']);

  // Doors and windows: the canvas reads their semantic fields.
  const doorsFingerprint = fingerprint(source?.doors, [
    'hingeX', 'hingeY', 'wallAngle', 'width', 'isOutward', 'isLeftHand',
  ]);
  const windowsFingerprint = fingerprint(source?.windows, [
    'startX', 'startY', 'endX', 'endY', 'width',
  ]);

  const sourceHash = [
    source?.id ?? '',
    source?.elements?.length ?? 0,
    source?.walls?.length ?? 0,
    source?.doors?.length ?? 0,
    source?.windows?.length ?? 0,
    source?.rooms?.length ?? 0,
    source?.electricalFixtures?.length ?? 0,
    lastId(source?.elements),
    // Content fingerprints — edits that don't change counts.
    roomsFingerprint,
    wallsFingerprint,
    doorsFingerprint,
    windowsFingerprint,
  ].join('|');

  const layersHash = Object.keys(layers)
    .sort()
    .map((k) => `${k}:${layers[k] ? 1 : 0}`)
    .join(',');

  return useMemo(() => {
    if (!source) return { elements: [] } as any;

    const hiddenLayersMap = (window as any).__hiddenLayersMap || {};

    const isDoorLayerVisible =
      layers.doors !== false &&
      !hiddenLayersMap['doors'] &&
      !hiddenLayersMap['door'];

    const isRoomLayerVisible =
      layers.rooms !== false &&
      !hiddenLayersMap['rooms'] &&
      !hiddenLayersMap['room'];

    const isFixtureLayerVisible =
      layers.fixtures !== false &&
      !hiddenLayersMap['fixtures'] &&
      !hiddenLayersMap['fixture'];

    // ── Case 1: the source already carries elements ─────────────────
    if (Array.isArray(source.elements) && source.elements.length > 0) {
      const filteredElements = source.elements.filter((e: any) => {
        const t = String(e?.type ?? '').toLowerCase();
        if (t === 'door' && !isDoorLayerVisible) return false;
        if (t === 'room' && !isRoomLayerVisible) return false;
        if (t === 'fixture' && !isFixtureLayerVisible) return false;
        return true;
      });

      return {
        ...source,
        elements: filteredElements,
        doors: isDoorLayerVisible && Array.isArray(source.doors) ? source.doors : [],
        rooms: isRoomLayerVisible && Array.isArray(source.rooms) ? source.rooms : [],
        electricalFixtures:
          source.electricalFixtures ||
          (() => {
            try {
              const pj = source.placedFixturesJson;
              if (!pj) return [];
              const parsed = typeof pj === 'string' ? JSON.parse(pj) : pj;
              return Array.isArray(parsed?.electricalFixtures) ? parsed.electricalFixtures : [];
            } catch {
              return [];
            }
          })(),
      } as any;
    }

    // ── Case 2: the source is a raw DB payload ──────────────────────
    const plan = transformDbSchemaToCanvasSchema(source);

    if (!isDoorLayerVisible) {
      plan.doors = [];
      if (Array.isArray(plan.elements)) {
        plan.elements = plan.elements.filter(
          (e: any) => String(e?.type ?? '').toLowerCase() !== 'door'
        );
      }
    }

    if (!isRoomLayerVisible && Array.isArray(plan.elements)) {
      plan.elements = plan.elements.filter(
        (e: any) => String(e?.type ?? '').toLowerCase() !== 'room'
      );
    }

    if (!isFixtureLayerVisible && Array.isArray(plan.elements)) {
      plan.elements = plan.elements.filter(
        (e: any) => String(e?.type ?? '').toLowerCase() !== 'fixture'
      );
    }

    return plan;
  }, [sourceHash, layersHash]);
};

export default usePlanRenderer;