// src/modules/FloorPlanDesigner/Sidebar/ComponentExplorer.tsx

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { setMultiSelection } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

interface ComponentExplorerProps {
  toolManager?: any;
  toolContext?: any;
}

/**
 * Classifies a raw element into one of the panel's buckets:
 *   'walls' | 'doors' | 'windows' | 'rooms' | 'fixtures' | 'rawgeometry' | null
 *
 * Must stay identical to LayerExplorer.classifyElementLayer so both
 * panels report the same totals.
 */
function classifyElementBucket(
  el: any
): 'walls' | 'doors' | 'windows' | 'rooms' | 'fixtures' | 'rawgeometry' | null {
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

  if (t === 'fixture' || t === 'fixtures' || el.isFixture === true) return 'fixtures';

  if (
    t === 'wall' || t === 'walls' ||
    t === 'polyline' || t === '' ||
    l === 'semantic_wall' || l === 'semantic_wall_structural'
  ) return 'walls';

  return null;
}

/**
 * ComponentExplorer — inventory panel for committed walls, doors,
 * windows, rooms, fixtures, and raw geometry.
 *
 * Rows: for walls / doors / windows / rooms, the panel shows one row
 * per physical object when the DXF import has run through the
 * grouping pipeline. Falls back to one row per element for documents
 * imported before grouping existed. Fixtures are one row per element —
 * they are point primitives with no grouping.
 *
 * Selection: bidirectional.
 *   Panel → canvas: clicking a row dispatches setSelection +
 *     setMultiSelection with every element id that shares the row's
 *     groupId, so all segments highlight together.
 *   Canvas → panel: clicking a grouped element on the canvas
 *     dispatches setSelection whose id IS the groupKey (see
 *     FloorPlanCanvas.handlePointerUp), and isItemSelected matches
 *     that against the row's id.
 */
export function ComponentExplorer({ toolManager, toolContext }: ComponentExplorerProps) {
  const dispatch = useAppDispatch();
  const floorPlanState = useAppSelector((state: any) => state.floorPlan || {});
  const currentSelection = floorPlanState.selection;
  const multiSelection = floorPlanState.multiSelection as string[] | undefined;
  const reduxLayers = floorPlanState.layers || {};
  const document = floorPlanState.document || {};

  const selectedElementId = useMemo(() => {
    if (!currentSelection) return null;
    const id = currentSelection.id ?? currentSelection.Id ?? null;
    return id != null ? String(id) : null;
  }, [currentSelection]);

  // ── Layer visibility resolution ──────────────────────────────────────────
  const isLayerVisible = useMemo(() => {
    return (layerKey: string): boolean => {
      const reduxValue = (reduxLayers as any)?.[layerKey];
      if (reduxValue !== undefined && reduxValue !== null) {
        if (typeof reduxValue === 'boolean') return reduxValue;
        if (typeof reduxValue === 'string') return reduxValue.toLowerCase() !== 'false';
      }
      const hiddenMap =
        (typeof window !== 'undefined' ? (window as any).__hiddenLayersMap : null) || {};
      if (hiddenMap[layerKey] === true) return false;
      if (layerKey === 'doors' && hiddenMap['door'] === true) return false;
      if (layerKey === 'walls' && hiddenMap['wall'] === true) return false;
      if (layerKey === 'windows' && hiddenMap['window'] === true) return false;
      if (layerKey === 'rooms' && hiddenMap['room'] === true) return false;
      if (layerKey === 'fixtures' && hiddenMap['fixture'] === true) return false;
      if (layerKey === 'rawgeometry' && hiddenMap['rawgeometry'] === true) return false;
      return true;
    };
  }, [reduxLayers]);

  const showWalls = isLayerVisible('walls');
  const showDoors = isLayerVisible('doors');
  const showWindows = isLayerVisible('windows');
  const showRooms = isLayerVisible('rooms');
  const showFixtures = isLayerVisible('fixtures');
  const showRawGeometry = isLayerVisible('rawgeometry');

  // ── Element source (fallback for documents without grouping) ────────────
  const rawElements = useMemo(() => {
    const fromRedux = document.elements;
    if (Array.isArray(fromRedux) && fromRedux.length > 0) return fromRedux;
    const globalDoc = (window as any).__floorPlanActiveDocumentInstance;
    return Array.isArray(globalDoc?.elements) ? globalDoc.elements : [];
  }, [document.elements]);

  // ── Group elements (fallback list, used when semantic is empty) ─────────
  const grouped = useMemo(() => {
    const walls: any[] = [];
    const doors: any[] = [];
    const windows: any[] = [];
    const rooms: any[] = [];
    const fixtures: any[] = [];
    const rawgeometry: any[] = [];

    for (const el of rawElements) {
      const bucket = classifyElementBucket(el);
      if (bucket === 'walls') walls.push(el);
      else if (bucket === 'doors') doors.push(el);
      else if (bucket === 'windows') windows.push(el);
      else if (bucket === 'rooms') rooms.push(el);
      else if (bucket === 'fixtures') fixtures.push(el);
      else if (bucket === 'rawgeometry') rawgeometry.push(el);
    }

    return { walls, doors, windows, rooms, fixtures, rawgeometry };
  }, [rawElements]);

  // ── Committed collections ───────────────────────────────────────────────
  const committedWalls = useMemo(
    () => (Array.isArray(document.walls) && document.walls.length > 0
      ? document.walls
      : grouped.walls),
    [document.walls, grouped.walls]
  );

  const committedDoors = useMemo(
    () => (Array.isArray(document.doors) && document.doors.length > 0
      ? document.doors
      : grouped.doors),
    [document.doors, grouped.doors]
  );

  const committedWindows = useMemo(
    () => (Array.isArray(document.windows) && document.windows.length > 0
      ? document.windows
      : grouped.windows),
    [document.windows, grouped.windows]
  );

  const committedRooms = useMemo(
    () => (Array.isArray(document.rooms) && document.rooms.length > 0
      ? document.rooms
      : grouped.rooms),
    [document.rooms, grouped.rooms]
  );

  // Fixtures live only in elements — there is no semantic document.fixtures
  // array. The grouped classification is the source of truth.
  const committedFixtures = grouped.fixtures;

  const committedRawGeometry = grouped.rawgeometry;

  const visibleWalls = showWalls ? committedWalls : [];
  const visibleDoors = showDoors ? committedDoors : [];
  const visibleWindows = showWindows ? committedWindows : [];
  const visibleRooms = showRooms ? committedRooms : [];
  const visibleFixtures = showFixtures ? committedFixtures : [];
  const visibleRawGeometry = showRawGeometry ? committedRawGeometry : [];

  const hiddenWallsCount = committedWalls.length - visibleWalls.length;
  const hiddenDoorsCount = committedDoors.length - visibleDoors.length;
  const hiddenWindowsCount = committedWindows.length - visibleWindows.length;
  const hiddenRoomsCount = committedRooms.length - visibleRooms.length;
  const hiddenFixturesCount = committedFixtures.length - visibleFixtures.length;
  const hiddenRawGeometryCount = committedRawGeometry.length - visibleRawGeometry.length;

  const [wallsOpen, setWallsOpen] = useState(true);
  const [doorsOpen, setDoorsOpen] = useState(true);
  const [windowsOpen, setWindowsOpen] = useState(true);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [fixturesOpen, setFixturesOpen] = useState(true);
  const [rawGeometryOpen, setRawGeometryOpen] = useState(false);

  // ── Reverse index: groupKey → set of element ids ────────────────────────
  //
  // Built once per document change. Enables O(1) group-membership checks
  // in isItemSelected, and O(1) member lookups in handleSelectAsset.
  const groupToElementIds = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const elements: any[] = Array.isArray(document.elements)
      ? document.elements
      : [];
    for (const el of elements) {
      const gk = el?.groupId ?? el?.GroupId ?? null;
      if (!gk) continue;
      const key = String(gk);
      if (!map.has(key)) map.set(key, new Set());
      const eid = String(el?.id ?? el?.Id ?? '');
      if (eid) map.get(key)!.add(eid);
    }
    return map;
  }, [document.elements]);

  // ── Selection handler ───────────────────────────────────────────────────
  //
  // Two kinds of items live in this panel:
  //
  //   1. Semantic entries (document.doors / .windows / .walls). Their
  //      id IS the groupId of the underlying elements.
  //
  //   2. Raw geometry elements and fixtures. Their id is the element id
  //      itself.
  //
  // We resolve using the reverse index: if `item.id` is a groupKey,
  // every member element id is selected. Otherwise, the item id is
  // used directly (raw geometry, ungrouped walls, fixtures).
  const handleSelectAsset = (item: any) => {
    const itemId = String(item?.id ?? item?.Id ?? '');

    const memberSet = groupToElementIds.get(itemId);
    const matchedGroup = !!memberSet && memberSet.size > 0;
    const targetIds: string[] = matchedGroup
      ? Array.from(memberSet!)
      : [itemId];

    const targetPayload = item?.properties
      ? item
      : {
          ...item,
          id: itemId,
          groupId: matchedGroup ? itemId : (item?.groupId ?? undefined),
          groupIds: targetIds,
          properties: { ...item, id: itemId, groupIds: targetIds },
        };

    dispatch({
      type: "floorPlan/setSelection",
      payload: targetPayload,
    });

    // Canvas highlight is driven by multiSelection, not selection.
    dispatch(setMultiSelection(targetIds));

    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
    window.dispatchEvent(new CustomEvent("canvas-invalidate"));
  };

  // ── Selection predicate ─────────────────────────────────────────────────
  //
  // Returns true when `item` is currently selected, either because:
  //   1. Its id matches the primary selection id (direct click).
  //   2. Its id appears in the multi-selection (rectangle select).
  //   3. Any element whose groupId === item.id is in the multi-selection
  //      (canvas click on a grouped segment).
  const isItemSelected = (item: any): boolean => {
    const rawId = item?.id ?? item?.Id ?? null;
    if (rawId == null) return false;
    const idStr = String(rawId);

    if (selectedElementId && selectedElementId === idStr) return true;

    if (!Array.isArray(multiSelection) || multiSelection.length === 0) {
      return false;
    }

    if (multiSelection.includes(idStr)) return true;

    const memberSet = groupToElementIds.get(idStr);
    if (!memberSet) return false;
    for (const eid of multiSelection) {
      if (memberSet.has(eid)) return true;
    }
    return false;
  };

  // ── Auto-scroll the selected row into view ─────────────────────────────
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const allItems = [
      ...committedWalls,
      ...committedDoors,
      ...committedWindows,
      ...committedRooms,
      ...committedFixtures,
      ...committedRawGeometry,
    ];
    const selectedItem = allItems.find((it) => isItemSelected(it));
    if (!selectedItem) return;

    const id = String(selectedItem.id ?? selectedItem.Id ?? '');
    const node = rowRefs.current.get(id);
    if (node) {
      node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [
    selectedElementId,
    multiSelection,
    committedWalls, committedDoors, committedWindows,
    committedRooms, committedFixtures, committedRawGeometry,
  ]);

  // ── Row renderer ────────────────────────────────────────────────────────
  const renderRow = (
    item: any,
    keyPrefix: string,
    accentColor: string,
    fallbackLabel: string,
    index: number
  ) => {
    const isSelected = isItemSelected(item);
    const rawId = item?.id ?? item?.Id;
    const id = String(rawId ?? `${keyPrefix}-${index}`);

    return (
      <div
        key={id}
        ref={node => {
          if (node) rowRefs.current.set(id, node);
          else rowRefs.current.delete(id);
        }}
        onClick={() => handleSelectAsset(item)}
        style={{
          padding: "6px 10px",
          borderRadius: "4px",
          background: isSelected ? "rgba(250, 204, 21, 0.12)" : "#090D16",
          border: isSelected
            ? `1px solid ${accentColor}`
            : "1px solid rgba(30,41,59,0.3)",
          color: isSelected ? "#FEF3C7" : "#94A3B8",
          fontSize: "10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          transition: "background 0.1s, border-color 0.1s",
        }}
        title={id}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: isSelected ? "bold" : "normal",
          }}
        >
          {(item.name || item.id || item.originalLayer || fallbackLabel).toUpperCase()}
        </span>
        {isSelected && (
          <span
            style={{
              fontSize: "9px",
              color: accentColor,
              fontWeight: "bold",
              flexShrink: 0,
            }}
          >
            ●
          </span>
        )}
      </div>
    );
  };

  const renderEmpty = (hiddenCount: number, emptyMessage: string) => {
    if (hiddenCount > 0) {
      return (
        <div style={{ padding: "12px", textAlign: "center", fontSize: "10px", color: "#475569" }}>
          {hiddenCount} {hiddenCount === 1 ? "item" : "items"} hidden by layer state.
        </div>
      );
    }
    return (
      <div style={{ padding: "12px", textAlign: "center", fontSize: "10px", color: "#475569" }}>
        {emptyMessage}
      </div>
    );
  };

  const renderCard = (
    title: string,
    visibleCount: number,
    hiddenCount: number,
    totalCount: number,
    isOpen: boolean,
    setOpen: (v: boolean) => void,
    accent: string,
    emptyMessage: string,
    items: any[],
    keyPrefix: string,
    fallbackLabel: string
  ) => (
    <div
      style={{
        border: "1px solid #1E293B",
        borderRadius: "8px",
        background: "#0B0F19",
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => setOpen(!isOpen)}
        style={{
          padding: "8px 12px",
          background: "#0F1424",
          borderBottom: "1px solid #1E293B",
          display: "flex",
          justifyContent: "space-between",
          cursor: "pointer",
          fontSize: "11px",
          fontWeight: "bold",
          color: "#94A3B8",
        }}
      >
        <span>
          {title} ({visibleCount}
          {hiddenCount > 0 ? ` / ${totalCount}` : ""})
        </span>
        <span>{isOpen ? "▼" : "►"}</span>
      </div>
      {isOpen && (
        <div
          style={{
            padding: "6px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            maxHeight: "160px",
            overflowY: "auto",
          }}
        >
          {items.length > 0
            ? items.map((item: any, i: number) =>
                renderRow(item, keyPrefix, accent, fallbackLabel, i)
              )
            : renderEmpty(hiddenCount, emptyMessage)}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        width: "100%",
        boxSizing: "border-box",
        fontFamily: "monospace",
      }}
    >
      <div>
        <h3
          style={{
            fontSize: "11px",
            fontWeight: "bold",
            color: "#EAB308",
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Structural Elements Deck
        </h3>
        <p style={{ fontSize: "10px", color: "#64748B", margin: "4px 0 0 0", lineHeight: "1.4" }}>
          Browse, inspect, and select committed floor plan fittings. Items whose layer is hidden
          are excluded from this list.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
        {renderCard(
          "🧱 COMMITTED WALLS",
          visibleWalls.length, hiddenWallsCount, committedWalls.length,
          wallsOpen, setWallsOpen,
          "#FACC15",
          "No user walls placed yet.",
          visibleWalls, "wall", "WALL_SEG"
        )}

        {renderCard(
          "🚪 COMMITTED DOORS",
          visibleDoors.length, hiddenDoorsCount, committedDoors.length,
          doorsOpen, setDoorsOpen,
          "#EAB308",
          "No doors inserted yet.",
          visibleDoors, "door", "DOOR_SEG"
        )}

        {renderCard(
          "🖼 WINDOWS",
          visibleWindows.length, hiddenWindowsCount, committedWindows.length,
          windowsOpen, setWindowsOpen,
          "#38BDF8",
          "No windows inserted yet.",
          visibleWindows, "window", "WINDOW_SEG"
        )}

        {renderCard(
          "🏠 ROOMS",
          visibleRooms.length, hiddenRoomsCount, committedRooms.length,
          roomsOpen, setRoomsOpen,
          "#05FFC4",
          "No rooms defined yet.",
          visibleRooms, "room", "ROOM"
        )}

        {renderCard(
          "💡 FIXTURES",
          visibleFixtures.length, hiddenFixturesCount, committedFixtures.length,
          fixturesOpen, setFixturesOpen,
          "#FDE047",
          "No fixtures in this document.",
          visibleFixtures, "fixture", "FIXTURE"
        )}

        {renderCard(
          "🧩 RAW GEOMETRY",
          visibleRawGeometry.length, hiddenRawGeometryCount, committedRawGeometry.length,
          rawGeometryOpen, setRawGeometryOpen,
          "#A78BFA",
          "No raw geometry in this document.",
          visibleRawGeometry, "rawgeom", "RAW_GEOM"
        )}
      </div>
    </div>
  );
}

export default ComponentExplorer;