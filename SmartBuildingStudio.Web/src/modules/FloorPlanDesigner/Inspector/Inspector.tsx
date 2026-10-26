// src/modules/FloorPlanDesigner/Inspector/Inspector.tsx
//
// Consolidated — case-insensitive selection type resolution.
// + RawGeometryInspector branch so raw geometry elements (unclassified
//   DXF content) can be reclassified into wall / door / window.
//
// The backend serializes ElementType with JsonStringEnumConverter
// (camelCase), so raw element types arrive as lowercase strings
// ("wall", "door", "window", "room"). Previously this component compared
// them against capitalized literals ("Wall", "Door", ...) and fell through
// to the "Generic Element" branch. Now we normalize first.

import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import * as FloorPlanActions from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

import DrawingInspector from "@/modules/FloorPlanDesigner/Inspector/DrawingInspector";
import WallInspector from "@/modules/FloorPlanDesigner/Inspector/WallInspector";
import DoorInspector from "@/modules/FloorPlanDesigner/Inspector/DoorInspector";
import WindowInspector from "@/modules/FloorPlanDesigner/Inspector/WindowInspector";
import RoomInspector from "@/modules/FloorPlanDesigner/Inspector/RoomInspector";
import RawGeometryInspector from "@/modules/FloorPlanDesigner/Inspector/RawGeometryInspector";

/**
 * Canonical inspector type keys, matching the six component branches below.
 * "RawGeometry" is new: elements with type 'rawgeometry' from the DXF
 * import that the layer classifier couldn't route to a semantic bucket.
 * They get the RawGeometryInspector which offers a Reclassify control.
 */
type InspectorType =
  | "None"
  | "Wall"
  | "Door"
  | "Window"
  | "Room"
  | "RawGeometry"
  | "Other";

/**
 * Resolves the inspector type for a given selection.
 *
 * Priority:
 *   1. Normalized type string from element.type
 *   2. Shape heuristics (transmittance → Window, doorType → Door, etc.)
 *   3. Constructor name (fallback for class instances)
 *   4. "None" if no selection, "Other" if unresolved
 */
function resolveInspectorType(selection: any): InspectorType {
  if (!selection) return "None";

  // ── 1. Canonical type from element.type ────────────────────────────────
  const rawType = String(selection.type ?? selection.Type ?? "")
    .trim()
    .toLowerCase();

  if (rawType === "wall")        return "Wall";
  if (rawType === "door")        return "Door";
  if (rawType === "window")      return "Window";
  if (rawType === "room")        return "Room";

  // Raw geometry: `app.py` labels unclassified DXF content as
  // 'rawgeometry'. Multiple spellings to be safe — `type: 'raw'`
  // exists in some legacy documents, and `type: ''` is the C#
  // ElementType.RawGeometry path via JsonStringEnumConverter.
  if (rawType === "rawgeometry" || rawType === "raw" || rawType === "raw_geometry") {
    return "RawGeometry";
  }

  // ── 2. Shape heuristics ────────────────────────────────────────────────
  if (selection.transmittance !== undefined) return "Window";
  if (selection.doorType !== undefined)      return "Door";
  if (
    selection.targetLux !== undefined ||
    selection.primaryGroup !== undefined
  ) {
    return "Room";
  }
  if (
    selection.startX !== undefined &&
    selection.thickness !== undefined
  ) {
    return "Wall";
  }

  // ── 3. Constructor name fallback ───────────────────────────────────────
  const ctorName = String(selection.constructor?.name ?? "").toLowerCase();
  if (ctorName.includes("window")) return "Window";
  if (ctorName.includes("wall"))   return "Wall";
  if (ctorName.includes("door"))   return "Door";
  if (ctorName.includes("room"))   return "Room";

  return "Other";
}

export default function Inspector() {
  const dispatch = useAppDispatch();
  const selection = useAppSelector((state) => state.floorPlan.selection);
  const [commitMessageVisible, setCommitMessageVisible] = useState(false);

  useEffect(() => {
    const handleGlobalCADCommitSuccess = () => {
      setCommitMessageVisible(true);
      const timer = setTimeout(() => {
        setCommitMessageVisible(false);
      }, 2500);
      return () => clearTimeout(timer);
    };

    window.addEventListener("sbs:cad-commit-success", handleGlobalCADCommitSuccess);
    return () => {
      window.removeEventListener("sbs:cad-commit-success", handleGlobalCADCommitSuccess);
    };
  }, []);

  const selectionType: InspectorType = resolveInspectorType(selection);

  const handleToggleInspectorActionDispatch = () => {
    const actions = FloorPlanActions as any;
    const toggleFunc =
      actions.toggleRightInspector ||
      actions.ToggleRightInspector ||
      actions.toggleInspector;
    if (typeof toggleFunc === "function") {
      dispatch(toggleFunc());
    } else {
      console.warn(
        "[CAD Inspector Guard]: No matching slice action method discovered in configuration maps."
      );
    }
  };

  return (
    <aside
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0F1424",
        borderLeft: "1px solid #1E293B",
        color: "#E2E8F0",
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
        boxSizing: "border-box",
      }}
    >
      {/* Header Strip */}
      <div
        style={{
          padding: "14px 16px",
          backgroundColor: "#090D16",
          borderBottom: "1px solid #1E293B",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "2px",
            background: "linear-gradient(180deg, #A855F7, #00D2FF)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "4px" }}>
          <span style={{ color: "#05FFC4", fontSize: "12px" }}>👁️</span>
          <h3
            style={{
              fontWeight: "bold",
              fontSize: "11px",
              fontFamily: "monospace",
              color: "#64748B",
              textTransform: "uppercase",
              margin: 0,
              letterSpacing: "0.05em",
            }}
          >
            Object Inspector
          </h3>
        </div>
        <button
          onClick={handleToggleInspectorActionDispatch}
          style={{
            background: "none",
            border: "none",
            color: "#64748B",
            fontSize: "11px",
            cursor: "pointer",
            padding: "4px 8px",
          }}
        >
          ✕
        </button>
      </div>

      {commitMessageVisible && (
        <div
          style={{
            background: "rgba(5, 255, 196, 0.1)",
            borderBottom: "1px solid #05FFC4",
            padding: "10px 16px",
            color: "#05FFC4",
            fontSize: "10px",
            fontFamily: "monospace",
            fontWeight: "bold",
            textAlign: "center",
            boxShadow: "0 4px 14px rgba(5, 255, 196, 0.2)",
            letterSpacing: "0.05em",
          }}
        >
          ✓ CAD LAYOUT PARAMETERS COMMITTED TO DATABASE
        </div>
      )}

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          backgroundColor: "#06090F",
        }}
      >
        {selectionType === "None" && <DrawingInspector />}
        {selectionType === "Wall" && <WallInspector selection={selection} />}
        {selectionType === "Door" && <DoorInspector selection={selection} />}
        {selectionType === "Window" && <WindowInspector selection={selection} />}
        {selectionType === "Room" && <RoomInspector selection={selection} />}
        {selectionType === "RawGeometry" && (
          <RawGeometryInspector selection={selection} />
        )}

        {selectionType === "Other" && (
          <div
            style={{
              padding: "14px",
              border: "1px solid #1E293B",
              backgroundColor: "#090D16",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "#64748B",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              Generic Element
            </div>
            <div style={{ fontSize: "14px", fontWeight: "bold", color: "#05FFC4" }}>
              {String(selection?.type ?? "unknown")}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#94A3B8",
                fontFamily: "monospace",
                backgroundColor: "#06080F",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid rgba(30,41,59,0.4)",
                wordBreak: "break-all",
              }}
            >
              {selection?.id || selection?.Id || "no-id"}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}