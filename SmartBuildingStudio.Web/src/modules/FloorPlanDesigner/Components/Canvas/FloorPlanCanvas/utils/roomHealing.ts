// src/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/utils/roomHealing.ts
//
// The room-healing pass that runs whenever the document changes: if a
// room exists in doc.rooms but its corresponding entry in doc.elements
// is missing or stale, this rebuilds it. Extracted verbatim from the
// original useEffect body in FloorPlanCanvas.tsx — behavior is
// unchanged.
//
// Returns the healed document, or `null` if nothing needed healing
// (so the caller can skip the dispatch and avoid a render loop).

import { getGroupKey } from './geometry';

export interface HealResult {
  /** Healed document, or null when no changes were needed. */
  document: any | null;
  /** True when at least one element was patched or added. */
  patched: boolean;
}

/**
 * Runs the room-healing pass over `doc`. Does not dispatch — the
 * caller decides whether to commit `result.document`.
 */
export function healRooms(doc: any): HealResult {
  if (!doc) return { document: null, patched: false };

  const elements: any[] = Array.isArray(doc.elements) ? doc.elements : [];
  const rooms: any[] = Array.isArray(doc.rooms) ? doc.rooms : [];
  if (rooms.length === 0) return { document: null, patched: false };

  const roomsById = new Map<string, any>();
  for (const r of rooms) {
    const rid = String(r.id ?? r.Id ?? '');
    if (rid) roomsById.set(rid, r);
  }

  let patched = false;

  const healedElements = elements.map((e: any) => {
    const eid = String(e.id ?? e.Id ?? '');
    const isRoom = e.isRoom === true || String(e.type ?? '').toLowerCase() === 'room';
    if (!isRoom || !eid) return e;

    const room = roomsById.get(eid);
    if (!room) return e;

    const needsName = !e.name && room.name;
    const needsLux = e.targetLux == null && room.targetLux != null;
    const needsGroup = e.primaryGroup == null && room.primaryGroup != null;
    const needsIsRoom = !e.isRoom;

    if (!needsName && !needsLux && !needsGroup && !needsIsRoom) return e;

    patched = true;
    return {
      ...e,
      type: 'room',
      isRoom: true,
      name: e.name ?? room.name,
      targetLux: e.targetLux ?? room.targetLux ?? 500,
      primaryGroup: e.primaryGroup ?? room.primaryGroup ?? 1,
      fillStyle: e.fillStyle || 'rgba(74, 222, 128, 0.15)',
      strokeStyle: e.strokeStyle || '#4ADE80',
      layer: e.layer || 'rooms',
    };
  });

  const elementIds = new Set(elements.map((e: any) => String(e.id ?? e.Id ?? '')));
  const fullyMissing = rooms.filter((r: any) => {
    const rid = String(r.id ?? r.Id ?? '');
    return rid && !elementIds.has(rid);
  });

  if (fullyMissing.length > 0) {
    patched = true;
    for (const r of fullyMissing) {
      healedElements.push({
        ...r,
        type: 'room',
        isRoom: true,
        fillStyle: r.fillStyle || 'rgba(74, 222, 128, 0.15)',
        strokeStyle: r.strokeStyle || '#4ADE80',
        layer: 'rooms',
      });
    }
  }

  if (!patched) return { document: null, patched: false };
  return { document: { ...doc, elements: healedElements }, patched: true };
}

/**
 * Collects the ids that must be deleted given a click-selection and a
 * multi-selection, fanning out to every member of any touched group.
 *
 * The fan-out is intentionally symmetric: selecting a door also
 * targets the parent wall group, and selecting the parent wall group
 * also targets the doors. This matches the original delete handler
 * and is required for the group-key scrub that follows.
 *
 * `fpsFixtureIds` are excluded because they're owned by the FPS
 * (fixtures-per-schematic) module and must not be touched here.
 */
export function collectDeletionIds(
  allElements: any[],
  singleId: string | null,
  multiSelectionIds: string[],
  fpsFixtureIds: Set<string>,
): { targetIds: Set<string>; groupKeysToDelete: Set<string> } {
  const targetIds = new Set<string>();

  if (singleId && !fpsFixtureIds.has(singleId)) targetIds.add(singleId);
  for (const id of multiSelectionIds) {
    if (!id) continue;
    const sid = String(id);
    if (fpsFixtureIds.has(sid)) continue;
    targetIds.add(sid);
  }

  const groupKeysToDelete = new Set<string>();
  for (const el of allElements) {
    const id = String(el?.id ?? el?.Id ?? '');
    const gk = getGroupKey(el);
    if (gk && targetIds.has(gk)) groupKeysToDelete.add(gk);
    if (!id || !targetIds.has(id)) continue;
    if (gk) groupKeysToDelete.add(gk);
  }

  if (groupKeysToDelete.size > 0) {
    for (const el of allElements) {
      const gk = getGroupKey(el);
      if (!gk || !groupKeysToDelete.has(gk)) continue;
      const id = String(el?.id ?? el?.Id ?? '');
      if (id && !fpsFixtureIds.has(id)) targetIds.add(id);
    }
  }

  return { targetIds, groupKeysToDelete };
}