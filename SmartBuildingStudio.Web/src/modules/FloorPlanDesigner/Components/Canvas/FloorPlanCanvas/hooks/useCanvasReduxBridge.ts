// src/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/hooks/useCanvasReduxBridge.ts
//
// Bridges FloorPlanCanvas to the Redux store and to the window.* escape
// hatches used by sibling modules (__floorPlanDispatch, __hiddenLayersMap,
// __floorPlanGetState, etc.). All side effects that reach outside React
// through `window` live here, so the orchestrator stays free of them.

import { useEffect } from 'react';
import { useAppDispatch } from '@/Application/ConfigureStore';
import { setDocument } from '@/modules/FloorPlanDesigner/Store/FloorPlanSlice';
import { healRooms } from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/utils/roomHealing';

interface UseCanvasReduxBridgeArgs {
  /** Full floorPlan slice snapshot, used for the __floorPlanGetState shim. */
  floorPlanState: any;
  /** True when at least one layer is hidden; drives __hiddenLayersMap. */
  layers: Record<string, boolean>;
}

/**
 * Registers the window.* bridges that sibling modules (FPS, properties
 * panel, etc.) rely on. Also runs the room-healing pass whenever the
 * document shape changes.
 *
 * Returns nothing; call it once from the orchestrator.
 */
export function useCanvasReduxBridge({ floorPlanState, layers }: UseCanvasReduxBridgeArgs): void {
  const dispatch = useAppDispatch();

  // ── window.__hiddenLayersMap (per-layer-visibility snapshot) ─────────
  useEffect(() => {
    const hiddenMap: Record<string, boolean> = {};
    if (layers.doors === false) { hiddenMap['doors'] = true; hiddenMap['door'] = true; }
    if (layers.walls === false) { hiddenMap['walls'] = true; hiddenMap['wall'] = true; }
    if (layers.windows === false) { hiddenMap['windows'] = true; hiddenMap['window'] = true; }
    if (layers.rooms === false) { hiddenMap['rooms'] = true; hiddenMap['room'] = true; }
    if (layers.rawgeometry === false) { hiddenMap['rawgeometry'] = true; }
    if (layers.exitRoutes === false) {
      hiddenMap['exitRoutes'] = true;
      hiddenMap['exitroute'] = true;
      hiddenMap['exitRoute'] = true;
    }
    (window as any).__hiddenLayersMap = hiddenMap;
  }, [layers]);

  // ── window.__floorPlanDispatch / GetState / ReduxState ──────────────
  useEffect(() => {
    const win = window as any;
    win.__floorPlanDispatch = dispatch;
    win.__floorPlanReduxState = floorPlanState;
    win.__floorPlanGetState = () => floorPlanState;

    return () => {
      win.__floorPlanDispatch = undefined;
      win.__floorPlanReduxState = undefined;
      win.__floorPlanGetState = undefined;
    };
  }, [dispatch, floorPlanState]);

  // ── Room healing pass ───────────────────────────────────────────────
  // Rebuilds doc.elements entries from doc.rooms when a room was
  // created without a matching element, or when element metadata went
  // stale. Runs on every document mutation; no-ops when nothing to heal.
  useEffect(() => {
    const doc = floorPlanState.document;
    if (!doc) return;

    const { document: healed } = healRooms(doc);
    if (healed) {
      dispatch(setDocument(healed));
    }
  }, [floorPlanState.document, dispatch]);
}