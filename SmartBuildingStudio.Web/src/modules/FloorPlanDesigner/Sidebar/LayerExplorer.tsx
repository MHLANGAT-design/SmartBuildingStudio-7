// src/modules/FloorPlanDesigner/Sidebar/LayerExplorer.tsx
//
// Layer panel. Rows are the user-facing categories; toggling a row
// updates three channels:
//
//   1. LayerManager deck  — immediate effect on canvas paint
//   2. Redux setLayerVisibility — load-time authority; canvas echoes back
//   3. __hiddenLayersMap — fallback channel for layers that read it
//
// The "Imported Drawings" row was removed because its backing layer
// (ImportedDrawingLayer) reads a data shape the backend DTO does not
// provide — the C# ImportedDrawingDto is a reference table for
// attached drawing files, not a container of vector geometry. The
// layer rendered nothing on every document shape we've seen, and a
// toggle that controls nothing is worse UX than no toggle. If a
// future feature needs a raw-CAD-underlay toggle, the existing
// "rawgeometry" row already serves that purpose via CanvasRenderer
// phase 5's __hiddenLayersMap gate.
//
// Row counts: for walls / doors / windows / rooms, the panel shows the
// grouped semantic count (document.doors.length etc.) when the DXF
// import has run through the grouping pipeline. Falls back to element
// counts for documents imported before grouping existed. See
// semanticCounts.countSemantic.

import React, { useState, useEffect, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import {
  markDirty,
  setDocument,
  setLayerVisibility,
} from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { LayerManager } from "@/modules/FloorPlanDesigner/Canvas/LayerManager";
import { countSemantic } from "@/modules/FloorPlanDesigner/Utils/semanticCounts";

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;
}

/**
 * Maps the panel's layer IDs to the Redux `LayerVisibilityState` keys.
 */
const LAYER_ID_TO_REDUX_KEY: Record<string, string> = {
  walls: 'walls',
  doors: 'doors',
  windows: 'windows',
  rooms: 'rooms',
  rawgeometry: 'rawgeometry',
  fixtures: 'fixtures',
  grid: 'grid',
};

/**
 * Maps the panel's layer IDs to the aliases used in __hiddenLayersMap.
 */
const LAYER_ID_TO_HIDDEN_ALIASES: Record<string, string[]> = {
  walls: ['walls', 'wall'],
  doors: ['doors', 'door'],
  windows: ['windows', 'window'],
  rooms: ['rooms', 'room'],
  rawgeometry: ['rawgeometry'],
  fixtures: ['fixtures', 'fixture'],
  grid: ['grid'],
};

/**
 * Deck ids (IRenderLayer.getId()) → panel ids.
 */
const DECK_ID_TO_PANEL_ID: Record<string, string> = {
  'grid-layer': 'grid',
  'walls':      'walls',
  'doors':      'doors',
  'windows':    'windows',
  'rooms':      'rooms',
};

const DEFAULT_LAYERS: Layer[] = [
  { id: "walls",       name: "Walls",               visible: true,  locked: false, order: 0 },
  { id: "doors",       name: "Doors",               visible: true,  locked: false, order: 1 },
  { id: "windows",     name: "Windows",             visible: true,  locked: false, order: 2 },
  { id: "rooms",       name: "Rooms",               visible: true,  locked: false, order: 3 },
  { id: "rawgeometry", name: "Raw CAD Geometry",    visible: false, locked: false, order: 4 },
  { id: "fixtures",    name: "Electrical Fixtures", visible: true,  locked: false, order: 5 },
  { id: "grid",        name: "Grid",                visible: true,  locked: false, order: 6 },
];

/**
 * Classifies a raw element's type into the panel's layer buckets.
 *
 * IMPORTANT: `type === 'rawgeometry'` must be checked BEFORE the wall
 * fallback, otherwise the C# ElementType.RawGeometry elements (which
 * arrive lowercased on `document.elements`) get counted as walls.
 *
 * The final fallback is `null` rather than `'walls'`. If something lands
 * here, it's genuinely unclassified and should be visible as such rather
 * than silently inflating the wall count.
 */
function classifyElementLayer(el: any): string | null {
  if (!el) return null;

  const t = String(el.type ?? el.Type ?? '').toLowerCase();
  const l = String(el.originalLayer ?? el.layer ?? el.Layer ?? '').toLowerCase();

  if (t === 'rawgeometry') return 'rawgeometry';

  if (
    t === 'door' || t === 'doors' ||
    l.includes('door') ||
    l === 'dr' || l.startsWith('dr-') || l.endsWith('-dr') ||
    l === 'semantic_door'
  ) return 'doors';

  if (
    t === 'window' || t === 'windows' ||
    l.includes('window') || l.includes('glaz') || l.includes('sash') ||
    l === 'wd' || l.startsWith('wd-') || l.endsWith('-wd') ||
    l === 'semantic_window'
  ) return 'windows';

  if (t === 'room' || t === 'rooms' || el.isRoom) return 'rooms';

  if (t === 'fixture' || el.isFixture) return 'fixtures';

  if (
    t === 'wall' || t === 'walls' ||
    t === 'polyline' || t === '' ||
    l === 'semantic_wall' || l === 'semantic_wall_structural'
  ) return 'walls';

  return null;
}

export function LayerExplorer() {
  const dispatch = useAppDispatch();
  const floorPlanState = useAppSelector((state: any) => state.floorPlan || {});
  const document = floorPlanState.document || {};
  const reduxLayers = floorPlanState.layers || {};

  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);

  const deck = React.useMemo(() => LayerManager.getInstance(), []);

  // ── Hydrate from document.layers if present (persisted), else defaults ──
  useEffect(() => {
    if (document.layers && Array.isArray(document.layers) && document.layers.length > 0) {
      setLayers(document.layers);
    }
  }, [document.layers]);

  // ── Keep local `layers` in sync with Redux AND drive the deck ─────────
  useEffect(() => {
    setLayers(prev =>
      prev.map(layer => {
        const reduxKey = LAYER_ID_TO_REDUX_KEY[layer.id];
        if (!reduxKey) return layer;
        const reduxValue = (reduxLayers as any)[reduxKey];
        if (reduxValue === undefined || reduxValue === null) return layer;
        return { ...layer, visible: Boolean(reduxValue) };
      })
    );

    const visibilityByPanelId: Record<string, boolean> = {};
    for (const [panelId, reduxKey] of Object.entries(LAYER_ID_TO_REDUX_KEY)) {
      const v = (reduxLayers as any)[reduxKey];
      if (typeof v === 'boolean') visibilityByPanelId[panelId] = v;
    }
    deck.applyVisibility(visibilityByPanelId, DECK_ID_TO_PANEL_ID);
  }, [reduxLayers, deck]);

  const syncLayerVisibility = useCallback((updatedLayers: Layer[]) => {
    // Channel 0: the deck — immediate paint effect.
    const visibilityByPanelId: Record<string, boolean> = {};
    updatedLayers.forEach(layer => {
      visibilityByPanelId[layer.id] = layer.visible;
    });
    deck.applyVisibility(visibilityByPanelId, DECK_ID_TO_PANEL_ID);

    // Channel 1: Redux setLayerVisibility.
    const reduxPayload: Record<string, boolean> = {};
    updatedLayers.forEach(layer => {
      const reduxKey = LAYER_ID_TO_REDUX_KEY[layer.id];
      if (reduxKey) reduxPayload[reduxKey] = layer.visible;
    });
    if (Object.keys(reduxPayload).length > 0) {
      dispatch(setLayerVisibility(reduxPayload));
    }

    // Channel 2: window.__hiddenLayersMap — fallback for layers that read it.
    const existingMap = (window as any).__hiddenLayersMap;
    const hiddenMap: Record<string, boolean> =
      existingMap && typeof existingMap === 'object' ? { ...existingMap } : {};

    updatedLayers.forEach(layer => {
      const aliases = LAYER_ID_TO_HIDDEN_ALIASES[layer.id] || [layer.id];
      if (layer.visible) {
        aliases.forEach(a => delete hiddenMap[a]);
      } else {
        aliases.forEach(a => { hiddenMap[a] = true; });
      }
    });

    (window as any).__hiddenLayersMap = hiddenMap;

    // Mirror into the global doc for persistence/debug.
    // Copy-on-write — the Redux object is frozen.
    const globalDoc = (window as any).__floorPlanActiveDocumentInstance;
    if (globalDoc && typeof globalDoc === "object") {
      (window as any).__floorPlanActiveDocumentInstance = {
        ...globalDoc,
        layers: updatedLayers,
        __hiddenLayersMap: hiddenMap,
      };
    }

    // Persist to document.layers.
    const updatedDocument = { ...document, layers: updatedLayers };
    dispatch(setDocument(updatedDocument));
    dispatch(markDirty());

    // Channel 3: force redraw.
    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
    window.dispatchEvent(new CustomEvent("canvas-invalidate"));
  }, [dispatch, document, deck]);

  const toggleVisibility = (layerId: string) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    );
    setLayers(updatedLayers);
    syncLayerVisibility(updatedLayers);
  };

  const toggleLock = (layerId: string) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
    );
    setLayers(updatedLayers);
    syncLayerVisibility(updatedLayers);
  };

  const moveLayerUp = (index: number) => {
    if (index === 0) return;
    const updatedLayers = [...layers];
    [updatedLayers[index], updatedLayers[index - 1]] =
      [updatedLayers[index - 1], updatedLayers[index]];
    updatedLayers.forEach((layer, i) => (layer.order = i));
    setLayers(updatedLayers);
    syncLayerVisibility(updatedLayers);
  };

  const moveLayerDown = (index: number) => {
    if (index === layers.length - 1) return;
    const updatedLayers = [...layers];
    [updatedLayers[index], updatedLayers[index + 1]] =
      [updatedLayers[index + 1], updatedLayers[index]];
    updatedLayers.forEach((layer, i) => (layer.order = i));
    setLayers(updatedLayers);
    syncLayerVisibility(updatedLayers);
  };

  /**
   * Element counts — the flat `elements` array tallied by bucket.
   * Used as the fallback for categories that have a grouped equivalent,
   * and as the direct count for rawgeometry / fixtures, which don't.
   */
  const elementCounts = React.useMemo(() => {
    const elements: any[] = document.elements || [];
    const counts: Record<string, number> = {
      walls: 0,
      doors: 0,
      windows: 0,
      rooms: 0,
      rawgeometry: 0,
      fixtures: 0,
    };

    for (const el of elements) {
      const bucket = classifyElementLayer(el);
      if (bucket && counts[bucket] !== undefined) {
        counts[bucket]++;
      }
    }

    return counts;
  }, [document.elements]);

  /**
   * Per-row count.
   *
   * For walls / doors / windows / rooms, prefer the grouped semantic
   * collections when they exist. A door drawn as 5 segments should
   * show as 1 door, not 5. Falls back to element counts for documents
   * imported before grouping existed.
   *
   * `rawgeometry` and `fixtures` have no grouped equivalent — they
   * count elements directly.
   *
   * `grid` returns -1 as a sentinel meaning "not countable" — the grid
   * is infinite, and a literal 0 next to a layer that is actively
   * painting gridlines reads as a lie.
   */
  const getLayerCount = (layerId: string): number => {
    switch (layerId) {
      case "walls":       return countSemantic(document.walls, elementCounts.walls);
      case "doors":       return countSemantic(document.doors, elementCounts.doors);
      case "windows":     return countSemantic(document.windows, elementCounts.windows);
      case "rooms":       return countSemantic(document.rooms, elementCounts.rooms);
      case "rawgeometry": return elementCounts.rawgeometry;
      case "fixtures":    return elementCounts.fixtures;
      case "grid":        return -1;
      default:            return 0;
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      padding: "8px",
      fontFamily: "monospace",
      fontSize: "11px"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "4px 8px",
        borderBottom: "1px solid #1E293B",
        color: "#94A3B8",
        fontWeight: "bold",
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: "0.5px"
      }}>
        <span>Layers</span>
        <span style={{ fontSize: "9px", color: "#64748B" }}>
          {layers.filter(l => l.visible).length}/{layers.length} visible
        </span>
      </div>

      {layers.map((layer, index) => (
        <div
          key={layer.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 8px",
            borderRadius: "4px",
            background: "rgba(30, 41, 59, 0.2)",
            border: "1px solid rgba(30, 41, 59, 0.3)",
            opacity: layer.visible ? 1 : 0.4
          }}
        >
          <button
            onClick={() => toggleVisibility(layer.id)}
            style={{
              background: "none",
              border: "none",
              color: layer.visible ? "#38BDF8" : "#475569",
              cursor: "pointer",
              fontSize: "14px",
              padding: "2px",
              width: "20px",
              textAlign: "center"
            }}
            title={layer.visible ? "Hide layer" : "Show layer"}
          >
            {layer.visible ? "👁" : "○"}
          </button>

          <span style={{
            flex: 1,
            color: layer.visible ? "#E2E8F0" : "#64748B",
            fontSize: "10px"
          }}>
            {layer.name}
          </span>

          <span style={{
            color: "#475569",
            fontSize: "9px",
            minWidth: "20px",
            textAlign: "right"
          }}>
            {getLayerCount(layer.id) >= 0 ? getLayerCount(layer.id) : "—"}
          </span>

          <button
            onClick={() => toggleLock(layer.id)}
            style={{
              background: "none",
              border: "none",
              color: layer.locked ? "#F59E0B" : "#475569",
              cursor: "pointer",
              fontSize: "12px",
              padding: "2px",
              width: "18px",
              textAlign: "center"
            }}
            title={layer.locked ? "Unlock layer" : "Lock layer"}
          >
            {layer.locked ? "🔒" : "🔓"}
          </button>

          <button
            onClick={() => moveLayerUp(index)}
            disabled={index === 0}
            style={{
              background: "none",
              border: "none",
              color: index === 0 ? "#1E293B" : "#64748B",
              cursor: index === 0 ? "not-allowed" : "pointer",
              fontSize: "10px",
              padding: "2px"
            }}
          >
            ▲
          </button>

          <button
            onClick={() => moveLayerDown(index)}
            disabled={index === layers.length - 1}
            style={{
              background: "none",
              border: "none",
              color: index === layers.length - 1 ? "#1E293B" : "#64748B",
              cursor: index === layers.length - 1 ? "not-allowed" : "pointer",
              fontSize: "10px",
              padding: "2px"
            }}
          >
            ▼
          </button>
        </div>
      ))}

      <div style={{
        display: "flex",
        gap: "8px",
        marginTop: "8px",
        paddingTop: "8px",
        borderTop: "1px solid #1E293B"
      }}>
        <button
          onClick={() => {
            const allVisible = layers.every(l => l.visible);
            const updatedLayers = layers.map(l => ({ ...l, visible: !allVisible }));
            setLayers(updatedLayers);
            syncLayerVisibility(updatedLayers);
          }}
          style={{
            flex: 1,
            background: "rgba(30, 41, 59, 0.2)",
            border: "1px solid #1E293B",
            color: "#94A3B8",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "9px",
            cursor: "pointer"
          }}
        >
          {layers.every(l => l.visible) ? "Hide All" : "Show All"}
        </button>
        <button
          onClick={() => {
            const updatedLayers = layers.map(l => ({ ...l, locked: false }));
            setLayers(updatedLayers);
            syncLayerVisibility(updatedLayers);
          }}
          style={{
            flex: 1,
            background: "rgba(30, 41, 59, 0.2)",
            border: "1px solid #1E293B",
            color: "#94A3B8",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "9px",
            cursor: "pointer"
          }}
        >
          Unlock All
        </button>
      </div>
    </div>
  );
}

export default LayerExplorer;