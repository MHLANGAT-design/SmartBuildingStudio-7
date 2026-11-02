// src/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/utils/deleteSelection.ts
//
// The Delete/Backspace handler body. Extracted verbatim from the
// original useEffect so the keyboard hook can be a thin wrapper.
//
// Inputs are the Redux state snapshot + dispatch, so this function has
// no React dependency and can be tested in isolation.

import { collectDeletionIds } from './roomHealing';

/** Arrays that may hold elements and must be scrubbed of deleted ids. */
const ARRAYS_TO_SCRUB = [
  'elements',
  'entities',
  'walls',
  'doors',
  'windows',
  'rooms',
  'items',
  'objects',
  'drawings',
  'components',
  'importedDrawings',
] as const;

/** Arrays whose keys must be scrubbed of deleted group keys. */
const GROUP_KEY_ARRAYS = ['doors', 'windows', 'walls'] as const;

export interface DeleteSelectionArgs {
  /** Full Redux floorPlan slice snapshot (needs .selection, .multiSelection, .document). */
  state: any;
  /** Redux dispatch function. */
  dispatch: (action: any) => void;
}

/**
 * Returns true if any element was actually removed. The caller uses
 * this to decide whether to `preventDefault()` — matching the original
 * handler, which only prevented default when there was something to
 * delete.
 */
export function deleteSelection({ state, dispatch }: DeleteSelectionArgs): boolean {
  const currentSelection = state?.selection;
  const currentMultiSelection: string[] = Array.isArray(state?.multiSelection)
    ? state.multiSelection
    : [];

  const rawDoc = state?.document;
  if (!rawDoc) return false;
  const allElements: any[] = Array.isArray(rawDoc.elements) ? rawDoc.elements : [];

  const fpsFixtureIds = new Set<string>(
    (Array.isArray(rawDoc.electricalFixtures) ? rawDoc.electricalFixtures : [])
      .map((f: any) => String(f?.id ?? f?.Id ?? ''))
      .filter((id: string) => id.length > 0),
  );

  const singleId = currentSelection
    ? String(currentSelection.id || currentSelection.Id || '')
    : '';

  const { targetIds, groupKeysToDelete } = collectDeletionIds(
    allElements,
    singleId || null,
    currentMultiSelection,
    fpsFixtureIds,
  );

  if (targetIds.size === 0) return false;

  try {
    const updatedDocument: any = { ...rawDoc };
    let removedAny = false;

    for (const key of ARRAYS_TO_SCRUB) {
      const arr = rawDoc[key];
      if (!Array.isArray(arr)) continue;

      const next = arr.filter((el: any) => {
        const id = String(el?.id ?? el?.Id ?? '');
        if (!id) return true;
        if (fpsFixtureIds.has(id)) return true;
        return !targetIds.has(id);
      });

      if (next.length !== arr.length) {
        updatedDocument[key] = next;
        removedAny = true;
      }
    }

    if (groupKeysToDelete.size > 0) {
      for (const key of GROUP_KEY_ARRAYS) {
        const arr = rawDoc[key];
        if (!Array.isArray(arr)) continue;
        const next = arr.filter((d: any) => {
          const id = String(d?.id ?? d?.Id ?? '');
          return !id || !groupKeysToDelete.has(id);
        });
        if (next.length !== arr.length) {
          updatedDocument[key] = next;
          removedAny = true;
        }
      }
    }

    if (!removedAny) return false;

    dispatch({ type: 'floorPlan/setSelection', payload: null });
    dispatch({ type: 'floorPlan/clearMultiSelection' });
    dispatch({ type: 'floorPlan/markDirty' });
    dispatch({ type: 'floorPlan/setDocument', payload: updatedDocument });

    return true;
  } catch (err) {
    console.error('[FloorPlanCanvas] Failed to delete elements:', err);
    return false;
  }
}