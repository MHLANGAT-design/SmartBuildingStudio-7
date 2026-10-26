// DrawingInspector.tsx
// Reads object counts from document.doors / windows / walls when available,
// falling back to element counting for older documents.

import React, { useMemo } from "react";
import { useAppSelector } from "@/Application/ConfigureStore";

/**
 * Classifies a raw element into one of the panel's buckets.
 * Mirrors CanvasRenderer step 6 / LayerExplorer / ComponentExplorer.
 */
function classifyElement(el: any): 'wall' | 'door' | 'window' | 'room' | 'other' {
  if (!el) return 'other';
  const t = String(el.type ?? el.Type ?? '').toLowerCase();
  const l = String(el.originalLayer ?? el.layer ?? el.Layer ?? '').toLowerCase();

  if (
    t === 'door' || t === 'doors' ||
    l.includes('door') ||
    l === 'dr' || l.startsWith('dr-') || l.endsWith('-dr')
  ) return 'door';

  if (
    t === 'window' || t === 'windows' ||
    l.includes('window') || l.includes('glaz') || l.includes('sash') ||
    l === 'wd' || l.startsWith('wd-') || l.endsWith('-wd')
  ) return 'window';

  if (t === 'room' || t === 'rooms' || el.isRoom) return 'room';

  if (
    t === 'wall' || t === 'walls' ||
    t === 'polyline' || t === ''
  ) return 'wall';

  return 'other';
}

/**
 * Count for a semantic category.
 *
 * Preference:
 *   1. The grouped collection (`document.doors`, `document.windows`,
 *      `document.walls`) — one entry per physical door / window / wall.
 *      This is what the panel wants when the DXF import has run through
 *      the grouping pipeline (see UseDxfImport).
 *   2. The flat element count — a fallback for documents imported
 *      before grouping existed, or for plans where the semantic
 *      collection hasn't been populated.
 *
 * The distinction matters: a door drawn as 5 segments should be one
 * door in the panel, not five.
 */
function countSemantic(
  semantic: any[] | undefined,
  elementCount: number
): number {
  if (Array.isArray(semantic) && semantic.length > 0) return semantic.length;
  return elementCount;
}

export default function DrawingInspector() {
  const floorPlanState = useAppSelector((state: any) => state.floorPlan || {});
  const document = floorPlanState.document || {};
  const isDirty = floorPlanState.isDirty || false;

  const validation = floorPlanState.validation || {
    hasErrors: false,
    hasWarnings: false,
    errorCount: 0,
    warningCount: 0,
    errors: [],
    warnings: []
  };

  // ── Element counts (fallback) ─────────────────────────────────────────
  // Used only when the semantic collections are missing or empty.
  const elementCounts = useMemo(() => {
    const elements: any[] = document.elements || [];
    let wall = 0, door = 0, window_ = 0, room = 0;
    for (const el of elements) {
      const bucket = classifyElement(el);
      if (bucket === 'wall') wall++;
      else if (bucket === 'door') door++;
      else if (bucket === 'window') window_++;
      else if (bucket === 'room') room++;
    }
    return { wall, door, window: window_, room };
  }, [document.elements]);

  // ── Object counts (primary) ───────────────────────────────────────────
  // Reads the grouped collections when they exist. This is what turns
  // "779 door segments" into "41 doors" in the panel.
  const wallCount = countSemantic(document.walls, elementCounts.wall);
  const doorCount = countSemantic(document.doors, elementCounts.door);
  const windowCount = countSemantic(document.windows, elementCounts.window);
  const roomCount = countSemantic(document.rooms, elementCounts.room);

  const fixtureCount = document.electricalFixtures?.length || 0;
  const drawingCount = document.importedDrawings?.length || 0;

  const totalElements =
    wallCount + doorCount + windowCount + roomCount + fixtureCount + drawingCount;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#E2E8F0",
      padding: "12px",
      backgroundColor: "#0B0F19",
      borderRadius: "8px",
      border: "1px solid #1E293B",
      height: "100%",
      overflow: "auto"
    }}>

      {/* Header */}
      <div style={{ position: "relative", paddingBottom: "12px", borderBottom: "1px solid #1E293B" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: "linear-gradient(180deg, #A855F7, #00D2FF)", borderRadius: "4px" }} />
        <div style={{ paddingLeft: "12px" }}>
          <span style={{ color: "#64748B", fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}>Canvas Workspace</span>
          <div style={{ fontSize: "13px", fontWeight: "bold", color: "#05FFC4", marginTop: "2px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Global Diagnostics
          </div>
        </div>
      </div>

      {/* File State Metadata Card */}
      <div style={{ backgroundColor: "#0F1424", padding: "16px", borderRadius: "12px", border: "1px solid #1E293B", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#64748B", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>File State</span>
          <span style={{
            fontSize: "10px",
            fontWeight: "bold",
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: "6px",
            letterSpacing: "0.05em",
            backgroundColor: isDirty ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
            color: isDirty ? "#F59E0B" : "#10B981",
            border: isDirty ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(16,185,129,0.2)"
          }}>
            {isDirty ? "Modified Draft" : "Synchronised"}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(30,41,59,0.4)" }}>
          <span style={{ color: "#64748B", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>Active Blueprint ID</span>
          <span style={{
            color: "#CBD5E1",
            fontSize: "11px",
            fontWeight: "bold",
            backgroundColor: "#06080F",
            border: "1px solid #1E293B",
            padding: "4px 8px",
            borderRadius: "4px"
          }} title={document?.id || "None"}>
            {document?.id ? document.id.substring(0, 12) + "..." : "SBS-UNTITLED-1"}
          </span>
        </div>
      </div>

      {/* Object Count Card */}
      <div style={{ backgroundColor: "#0F1424", padding: "16px", borderRadius: "12px", border: "1px solid #1E293B", display: "flex", flexDirection: "column", gap: "10px" }}>
        <span style={{ color: "#64748B", fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Object Count
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <div style={{ backgroundColor: "#06080F", padding: "8px", borderRadius: "6px", textAlign: "center", border: "1px solid #1E293B" }}>
            <div style={{ color: "#64748B", fontSize: "8px", textTransform: "uppercase" }}>Walls</div>
            <div style={{ color: "#38BDF8", fontSize: "16px", fontWeight: "bold" }}>{wallCount}</div>
          </div>
          <div style={{ backgroundColor: "#06080F", padding: "8px", borderRadius: "6px", textAlign: "center", border: "1px solid #1E293B" }}>
            <div style={{ color: "#64748B", fontSize: "8px", textTransform: "uppercase" }}>Doors</div>
            <div style={{ color: "#F59E0B", fontSize: "16px", fontWeight: "bold" }}>{doorCount}</div>
          </div>
          <div style={{ backgroundColor: "#06080F", padding: "8px", borderRadius: "6px", textAlign: "center", border: "1px solid #1E293B" }}>
            <div style={{ color: "#64748B", fontSize: "8px", textTransform: "uppercase" }}>Windows</div>
            <div style={{ color: "#10B981", fontSize: "16px", fontWeight: "bold" }}>{windowCount}</div>
          </div>
          <div style={{ backgroundColor: "#06080F", padding: "8px", borderRadius: "6px", textAlign: "center", border: "1px solid #1E293B" }}>
            <div style={{ color: "#64748B", fontSize: "8px", textTransform: "uppercase" }}>Rooms</div>
            <div style={{ color: "#A855F7", fontSize: "16px", fontWeight: "bold" }}>{roomCount}</div>
          </div>
          <div style={{ backgroundColor: "#06080F", padding: "8px", borderRadius: "6px", textAlign: "center", border: "1px solid #1E293B" }}>
            <div style={{ color: "#64748B", fontSize: "8px", textTransform: "uppercase" }}>Fixtures</div>
            <div style={{ color: "#EC4899", fontSize: "16px", fontWeight: "bold" }}>{fixtureCount}</div>
          </div>
          <div style={{ backgroundColor: "#06080F", padding: "8px", borderRadius: "6px", textAlign: "center", border: "1px solid #1E293B" }}>
            <div style={{ color: "#64748B", fontSize: "8px", textTransform: "uppercase" }}>Drawings</div>
            <div style={{ color: "#F97316", fontSize: "16px", fontWeight: "bold" }}>{drawingCount}</div>
          </div>
        </div>
        <div style={{ textAlign: "center", paddingTop: "8px", borderTop: "1px solid rgba(30,41,59,0.4)" }}>
          <span style={{ color: "#64748B", fontSize: "10px" }}>Total Objects: </span>
          <span style={{ color: "#E2E8F0", fontSize: "12px", fontWeight: "bold" }}>{totalElements}</span>
        </div>
      </div>

      {/* Integrity Audit Card */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ fontSize: "9px", fontWeight: "bold", color: "#64748B", letterSpacing: "0.1em", textTransform: "uppercase", paddingLeft: "4px" }}>
          DALI Rule Integrity Audit
        </div>

        <div style={{ backgroundColor: "#0F1424", borderRadius: "12px", border: "1px solid #1E293B", overflow: "hidden" }}>
          <div style={{ padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(30,41,59,0.4)" }}>
            <span style={{ color: "#E2E8F0", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>❌</span> Hardware Faults
            </span>
            <span style={{
              fontWeight: "bold",
              fontSize: "13px",
              backgroundColor: "#06080F",
              border: "1px solid #1E293B",
              padding: "2px 10px",
              borderRadius: "6px",
              minWidth: "28px",
              textAlign: "center",
              color: validation.hasErrors ? "#F87171" : "#475569"
            }}>
              {validation.errorCount || 0}
            </span>
          </div>

          <div style={{ padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#E2E8F0", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⚠️</span> System Warnings
            </span>
            <span style={{
              fontWeight: "bold",
              fontSize: "13px",
              backgroundColor: "#06080F",
              border: "1px solid #1E293B",
              padding: "2px 10px",
              borderRadius: "6px",
              minWidth: "28px",
              textAlign: "center",
              color: validation.hasWarnings ? "#FBBF24" : "#475569"
            }}>
              {validation.warningCount || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Document Info */}
      <div style={{ fontSize: "8px", color: "#475569", textAlign: "center", paddingTop: "8px", borderTop: "1px solid rgba(30,41,59,0.2)" }}>
        Document ID: {document?.id || "None"} | Version: {document?.version || 0}
      </div>
    </div>
  );
}