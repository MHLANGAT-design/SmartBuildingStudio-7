// src/modules/FloorPlanDesigner/Inspector/WindowInspector.tsx
//
// LEVEL 1 LOCK ENFORCEMENT: metadata card and commit button disabled
// when the document is locked by another user. Derived (read-only)
// fields and the reclassify panel (which gates itself) are unchanged.

import React, { useState, useEffect, useMemo, FormEvent } from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { setDocument } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { ReclassifyControls } from "./ReclassifyControls";
import { useFloorPlanLockState } from "@/modules/FloorPlanDesigner/hooks/useFloorPlanLockState";

interface WindowInspectorProps {
  selection?: any;
  pixelsPerMm?: number;
}

const WINDOW_TYPE_OPTIONS = [
  "Fixed", "Casement", "Awning", "Sliding", "Double-Hung", "Bay",
] as const;
type WindowTypeOption = typeof WINDOW_TYPE_OPTIONS[number];

const GLAZING_OPTIONS = [
  "Single", "Double", "Triple", "Laminated", "Tempered",
] as const;
type GlazingOption = typeof GLAZING_OPTIONS[number];

export function WindowInspector({ selection, pixelsPerMm = 0.05 }: WindowInspectorProps) {
  const dispatch = useAppDispatch();
  const floorPlanState = useAppSelector((state: any) => state.floorPlan || {});
  const { isReadOnly, lockedByUsername } = useFloorPlanLockState();

  const globalDoc = (window as any).__floorPlanActiveDocumentInstance;
  const currentWindowsPool = useMemo(() => {
    const redux = floorPlanState.document?.windows;
    if (Array.isArray(redux) && redux.length > 0) return redux;
    const gd = globalDoc?.windows;
    if (Array.isArray(gd) && gd.length > 0) return gd;
    const gdAlt = globalDoc?._windows;
    if (Array.isArray(gdAlt) && gdAlt.length > 0) return gdAlt;
    return [];
  }, [floorPlanState.document?.windows, globalDoc?.windows, globalDoc?._windows]);

  const activeWindowPayload = useMemo(() => {
    const selectionId = selection?.id ?? selection?.Id;
    if (selectionId) {
      const fresh = currentWindowsPool.find(
        (w: any) => String(w.id ?? w.Id) === String(selectionId)
      );
      return fresh ?? selection;
    }
    if (currentWindowsPool.length > 0) {
      return currentWindowsPool[currentWindowsPool.length - 1];
    }
    return null;
  }, [selection, currentWindowsPool]);

  const [name, setName] = useState("");
  const [windowType, setWindowType] = useState<WindowTypeOption>("Fixed");
  const [glazing, setGlazing] = useState<GlazingOption>("Double");
  const [frameMaterial, setFrameMaterial] = useState("Aluminium");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!activeWindowPayload) return;
    setName(String(activeWindowPayload.name ?? ""));
    const wt = String(activeWindowPayload.windowType ?? "");
    setWindowType(
      (WINDOW_TYPE_OPTIONS as readonly string[]).includes(wt)
        ? (wt as WindowTypeOption) : "Fixed"
    );
    const gz = String(
      activeWindowPayload.glazing ?? activeWindowPayload.properties?.glazing ?? "Double"
    );
    setGlazing(
      (GLAZING_OPTIONS as readonly string[]).includes(gz)
        ? (gz as GlazingOption) : "Double"
    );
    setFrameMaterial(String(
      activeWindowPayload.frameMaterial ?? activeWindowPayload.properties?.frameMaterial ?? "Aluminium"
    ));
    setNotes(String(
      activeWindowPayload.notes ?? activeWindowPayload.properties?.notes ?? ""
    ));
  }, [activeWindowPayload]);

  if (!activeWindowPayload) return null;

  const startX = Number(activeWindowPayload.startX ?? activeWindowPayload.x ?? 0);
  const startY = Number(activeWindowPayload.startY ?? activeWindowPayload.y ?? 0);
  const endX = Number(activeWindowPayload.endX ?? startX + (activeWindowPayload.width ?? 0));
  const endY = Number(activeWindowPayload.endY ?? startY);
  const width = Number(activeWindowPayload.width ?? Math.hypot(endX - startX, endY - startY));
  const height = Number(activeWindowPayload.height ?? 1200);

  const dx = endX - startX;
  const dy = endY - startY;
  let wallAngleRad = Math.atan2(dy, dx);
  if (wallAngleRad < 0) wallAngleRad += 2 * Math.PI;
  const wallAngleDeg = (wallAngleRad * 180) / Math.PI;
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  const sillLevel = Number(
    activeWindowPayload.sillLevel ?? activeWindowPayload.properties?.sillLevel ?? 900
  );

  const derived = {
    width, height, startX, startY, endX, endY,
    wallAngleRad, wallAngleDeg, horizontal, sillLevel,
    blockName: String(activeWindowPayload.properties?.blockName ?? ""),
    groupId: String(activeWindowPayload.id ?? activeWindowPayload.Id ?? ""),
  };

  const canvasPxWidth = Math.round(derived.width * pixelsPerMm);
  const canvasPxHeight = Math.round(derived.height * pixelsPerMm);
  const blockNameShort = derived.blockName ? derived.blockName.split(" - ")[0] : "";

  const handleCommit = (e: FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!activeWindowPayload) return;

    const id = String(activeWindowPayload.id || activeWindowPayload.Id);

    const updatedWindowPayload = {
      ...activeWindowPayload,
      id,
      name: name.trim() || undefined,
      windowType,
      glazing,
      frameMaterial,
      notes: notes.trim() || undefined,
      startX: derived.startX,
      startY: derived.startY,
      endX: derived.endX,
      endY: derived.endY,
      width: derived.width,
      height: derived.height,
      properties: {
        ...(activeWindowPayload.properties || {}),
        glazing,
        frameMaterial,
        sillLevel: derived.sillLevel,
        notes: notes.trim() || undefined,
        lastModified: Date.now(),
      },
    };

    const updatedWindowsPool = currentWindowsPool.map((w: any) =>
      String(w.id || w.Id) === id ? updatedWindowPayload : w
    );

    if (globalDoc) globalDoc.windows = updatedWindowsPool;

    if (floorPlanState.document) {
      dispatch(setDocument({ ...floorPlanState.document, windows: updatedWindowsPool }));
    }

    window.dispatchEvent(new CustomEvent("sbs:cad-commit-success"));
    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
    window.dispatchEvent(new CustomEvent("sbs:canvas-invalidate"));
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "16px",
      fontFamily: "monospace", fontSize: "12px", color: "#E2E8F0", minWidth: 0,
    }}>
      <ReclassifyControls elementId={derived.groupId} current="window" />

      <form onSubmit={handleCommit} style={{
        display: "flex", flexDirection: "column", gap: "16px", minWidth: 0,
      }}>
        {/* Header */}
        <div style={{ position: "relative", paddingBottom: "12px", borderBottom: "1px solid #1E293B" }}>
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: "4px",
            background: "linear-gradient(180deg, #38BDF8, #22D3EE)", borderRadius: "4px",
          }} />
          <div style={{
            paddingLeft: "12px", display: "flex", justifyContent: "space-between",
            alignItems: "center", gap: "8px",
          }}>
            <div style={{ minWidth: 0 }}>
              <span style={{
                color: "#64748B", fontSize: "9px", fontWeight: "bold",
                textTransform: "uppercase",
              }}>Fenestration</span>
              <div style={{
                fontSize: "13px", fontWeight: "bold", color: "#38BDF8", marginTop: "2px",
              }}>Window Matrix</div>
            </div>
            <span style={{
              fontSize: "10px", color: "#38BDF8", backgroundColor: "#0F172A",
              padding: "2px 6px", borderRadius: "4px", border: "1px solid #0284C7",
              flexShrink: 0,
            }}>{derived.groupId || "—"}</span>
          </div>
        </div>

        {/* Derived (read-only) */}
        <div style={{
          backgroundColor: "#0B0F19", padding: "16px", borderRadius: "12px",
          border: "1px solid #1E293B", display: "flex", flexDirection: "column",
          gap: "12px", minWidth: 0,
        }}>
          <div style={{
            fontSize: "9px", fontWeight: "bold", color: "#64748B",
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>Window Properties</div>

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", minWidth: 0,
          }}>
            <ReadonlyField label="Opening Width" value={`${derived.width.toFixed(0)} mm`} accent="#38BDF8" />
            <ReadonlyField label="Canvas Footprint" value={`${canvasPxWidth} px`} accent="#22D3EE" />
            <ReadonlyField label="Opening Height" value={`${derived.height.toFixed(0)} mm`} accent="#38BDF8" />
            <ReadonlyField label="Canvas Height" value={`${canvasPxHeight} px`} accent="#22D3EE" />
            <ReadonlyField label="Start" value={`${derived.startX.toFixed(0)}, ${derived.startY.toFixed(0)}`} />
            <ReadonlyField label="End" value={`${derived.endX.toFixed(0)}, ${derived.endY.toFixed(0)}`} />
            <ReadonlyField label="Wall Orientation" value={`${derived.wallAngleDeg.toFixed(1)}°`} />
            <ReadonlyField label="Axis" value={derived.horizontal ? "Horizontal" : "Vertical"} />
            <ReadonlyField label="Sill Level" value={`${derived.sillLevel.toFixed(0)} mm`} />
            <ReadonlyField label="Head Height" value={`${(derived.sillLevel + derived.height).toFixed(0)} mm`} />
          </div>

          {blockNameShort ? (
            <FullWidthField label="Source Block" value={blockNameShort} title={derived.blockName} />
          ) : null}

          <div style={{ fontSize: "9px", color: "#475569", lineHeight: 1.5, marginTop: 4 }}>
            Read-only. Set when the window was created or imported. To change these, redraw the window.
          </div>
        </div>

        {/* Metadata (GATED) */}
        <div
          style={{
            backgroundColor: "#0B0F19", padding: "16px", borderRadius: "12px",
            border: "1px solid #1E293B", display: "flex", flexDirection: "column",
            gap: "14px", minWidth: 0,
            opacity: isReadOnly ? 0.6 : 1, transition: "opacity 0.15s",
          }}
          title={isReadOnly
            ? `Read-only: locked by ${lockedByUsername || "another user"}` : undefined}
        >
          <div style={{
            fontSize: "9px", fontWeight: "bold", color: "#64748B",
            letterSpacing: "0.1em", textTransform: "uppercase",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>Metadata</span>
            {isReadOnly && (
              <span style={{ color: "#FFB800", fontSize: "9px" }}>🔒 READ-ONLY</span>
            )}
          </div>

          <EditableField label="Name">
            <input type="text" value={name} disabled={isReadOnly}
              onChange={(e) => setName(e.target.value)}
              placeholder={derived.groupId || "Unnamed Window"}
              style={{
                ...textInputStyle,
                cursor: isReadOnly ? "not-allowed" : "text",
                opacity: isReadOnly ? 0.5 : 1,
              }} />
          </EditableField>

          <EditableField label="Window Type">
            <select value={windowType} disabled={isReadOnly}
              onChange={(e) => setWindowType(e.target.value as WindowTypeOption)}
              style={{
                ...selectStyle,
                cursor: isReadOnly ? "not-allowed" : "pointer",
                opacity: isReadOnly ? 0.5 : 1,
              }}>
              {WINDOW_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt} style={{ backgroundColor: "#06080F" }}>{opt}</option>
              ))}
            </select>
          </EditableField>

          <EditableField label="Glazing">
            <select value={glazing} disabled={isReadOnly}
              onChange={(e) => setGlazing(e.target.value as GlazingOption)}
              style={{
                ...selectStyle,
                cursor: isReadOnly ? "not-allowed" : "pointer",
                opacity: isReadOnly ? 0.5 : 1,
              }}>
              {GLAZING_OPTIONS.map((opt) => (
                <option key={opt} value={opt} style={{ backgroundColor: "#06080F" }}>{opt}</option>
              ))}
            </select>
          </EditableField>

          <EditableField label="Frame Material">
            <input type="text" value={frameMaterial} disabled={isReadOnly}
              onChange={(e) => setFrameMaterial(e.target.value)}
              style={{
                ...textInputStyle,
                cursor: isReadOnly ? "not-allowed" : "text",
                opacity: isReadOnly ? 0.5 : 1,
              }} />
          </EditableField>

          <EditableField label="Notes">
            <textarea value={notes} disabled={isReadOnly}
              onChange={(e) => setNotes(e.target.value)} rows={2}
              style={{
                ...textInputStyle,
                resize: "vertical" as const,
                cursor: isReadOnly ? "not-allowed" : "text",
                opacity: isReadOnly ? 0.5 : 1,
              }} />
          </EditableField>
        </div>

        <button
          type="submit"
          disabled={isReadOnly}
          title={isReadOnly
            ? `Read-only: locked by ${lockedByUsername || "another user"}` : undefined}
          style={{
            width: "100%",
            backgroundColor: isReadOnly
              ? "rgba(100, 116, 139, 0.06)"
              : "rgba(56, 189, 248, 0.06)",
            border: `1px solid ${isReadOnly ? "#334155" : "#38BDF8"}`,
            color: isReadOnly ? "#475569" : "#38BDF8",
            padding: "10px 0", borderRadius: "8px", fontSize: "11px",
            fontWeight: "bold", textTransform: "uppercase",
            cursor: isReadOnly ? "not-allowed" : "pointer",
            letterSpacing: "0.05em", opacity: isReadOnly ? 0.6 : 1,
          }}
        >
          {isReadOnly ? "🔒 Commit Metadata" : "⚡ Commit Metadata"}
        </button>
      </form>
    </div>
  );
}

// ─── Presentation helpers ────────────────────────────────────────────
function ReadonlyField({ label, value, accent }: { label: string; value: string; accent?: string; }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
      <span style={{ fontSize: "9px", color: "#64748B" }}>{label}</span>
      <span style={{
        fontSize: "11px", color: accent ?? "#F1F5F9", fontWeight: "bold",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0,
      }} title={value}>{value}</span>
    </div>
  );
}

function FullWidthField({ label, value, title }: { label: string; value: string; title?: string; }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
      <span style={{ fontSize: "9px", color: "#64748B" }}>{label}</span>
      <span style={{
        fontSize: "11px", color: "#F1F5F9", fontWeight: "bold",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0,
      }} title={title ?? value}>{value}</span>
    </div>
  );
}

function EditableField({ label, children }: { label: string; children: React.ReactNode; }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={{ fontSize: "9px", color: "#64748B", textTransform: "uppercase" }}>{label}</span>
      {children}
    </div>
  );
}

const textInputStyle: React.CSSProperties = {
  width: "100%", backgroundColor: "#06080F", border: "1px solid #1E293B",
  borderRadius: "6px", color: "#F1F5F9", fontSize: "11px",
  fontFamily: "monospace", padding: "6px 8px", outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = { ...textInputStyle, cursor: "pointer" };

export default WindowInspector;