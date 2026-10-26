// src/modules/FloorPlanDesigner/Inspector/WallInspector.tsx
//
// LEVEL 1 LOCK ENFORCEMENT: thickness input, material select, and the
// commit button are disabled when the document is locked by another
// user. Derived (read-only) fields and the reclassify panel (which
// gates itself) are unchanged.

import React, { useState, useEffect, useMemo, FormEvent } from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { setDocument } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { ReclassifyControls } from "./ReclassifyControls";
import { useFloorPlanLockState } from "@/modules/FloorPlanDesigner/hooks/useFloorPlanLockState";

interface WallInspectorProps {
  selection?: any;
}

const MATERIAL_OPTIONS = [
  "Concrete",
  "Brick",
  "Drywall",
  "Glass",
] as const;
type MaterialOption = typeof MATERIAL_OPTIONS[number];

export function WallInspector({ selection }: WallInspectorProps) {
  const dispatch = useAppDispatch();
  const floorPlanState = useAppSelector((state: any) => state.floorPlan || {});
  const { isReadOnly, lockedByUsername } = useFloorPlanLockState();

  // ── Pool selection ─────────────────────────────────────────────────
  const globalDoc = (window as any).__floorPlanActiveDocumentInstance;
  const currentWallsPool = useMemo(() => {
    const redux = floorPlanState.document?.walls;
    if (Array.isArray(redux) && redux.length > 0) return redux;

    const gd = globalDoc?.walls;
    if (Array.isArray(gd) && gd.length > 0) return gd;

    const gdAlt = globalDoc?._walls;
    if (Array.isArray(gdAlt) && gdAlt.length > 0) return gdAlt;

    return [];
  }, [floorPlanState.document?.walls, globalDoc?.walls, globalDoc?._walls]);

  // ── Active record — ID lookup, not source-of-truth selection ───────
  const activeWallPayload = useMemo(() => {
    const selectionId = selection?.id ?? selection?.Id;
    if (selectionId) {
      const fresh = currentWallsPool.find(
        (w: any) => String(w.id ?? w.Id) === String(selectionId)
      );
      return fresh ?? selection;
    }
    if (currentWallsPool.length > 0) {
      return currentWallsPool[currentWallsPool.length - 1];
    }
    return null;
  }, [selection, currentWallsPool]);

  // ── Editable metadata state ────────────────────────────────────────
  const [thickness, setThickness] = useState("300");
  const [material, setMaterial] = useState<MaterialOption>("Concrete");

  useEffect(() => {
    if (!activeWallPayload) return;
    setThickness(String(activeWallPayload.thickness ?? 300));
    const m = String(activeWallPayload.material ?? "Concrete");
    setMaterial(
      (MATERIAL_OPTIONS as readonly string[]).includes(m)
        ? (m as MaterialOption)
        : "Concrete"
    );
  }, [activeWallPayload]);

  if (!activeWallPayload) return null;

  // ── Read-only derived fields ───────────────────────────────────────
  const derived = {
    startX: Number(
      activeWallPayload.startX ?? activeWallPayload.start?.x ?? 0
    ),
    startY: Number(
      activeWallPayload.startY ?? activeWallPayload.start?.y ?? 0
    ),
    endX: Number(activeWallPayload.endX ?? activeWallPayload.end?.x ?? 0),
    endY: Number(activeWallPayload.endY ?? activeWallPayload.end?.y ?? 0),
    thickness: Number(activeWallPayload.thickness ?? 300),
    height: Number(activeWallPayload.height ?? 2800),
    groupId: String(activeWallPayload.id ?? activeWallPayload.Id ?? ""),
  };

  const length = Math.hypot(
    derived.endX - derived.startX,
    derived.endY - derived.startY
  );
  const dx = derived.endX - derived.startX;
  const dy = derived.endY - derived.startY;
  let wallAngleRad = Math.atan2(dy, dx);
  if (wallAngleRad < 0) wallAngleRad += 2 * Math.PI;
  const wallAngleDeg = (wallAngleRad * 180) / Math.PI;

  // ── Commit: thickness + material only. Geometry echoed. ────────────
  const handleCommit = (e: FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!activeWallPayload) return;

    const id = String(activeWallPayload.id || activeWallPayload.Id);

    const updatedWallPayload = {
      ...activeWallPayload,
      id,
      thickness: Number(thickness) || derived.thickness,
      material,
    };

    const updatedWallsPool = currentWallsPool.map((wall: any) =>
      String(wall.id || wall.Id) === id ? updatedWallPayload : wall
    );

    if (globalDoc) {
      globalDoc.walls = updatedWallsPool;
      globalDoc._walls = updatedWallsPool;
      if (Array.isArray(globalDoc.customDrawnWalls)) {
        globalDoc.customDrawnWalls = updatedWallsPool.filter(
          (w: any) => !w.isRoomBorder
        );
      }
    }

    if (floorPlanState.document) {
      dispatch(
        setDocument({
          ...floorPlanState.document,
          walls: updatedWallsPool,
        })
      );
    }

    window.dispatchEvent(new CustomEvent("sbs:cad-commit-success"));
    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
    window.dispatchEvent(new CustomEvent("sbs:canvas-invalidate"));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#E2E8F0",
        minWidth: 0,
      }}
    >
      {/* Reclassify control — self-gating; leave as-is. */}
      <ReclassifyControls elementId={derived.groupId} current="wall" />

      <form
        onSubmit={handleCommit}
        style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}
      >
        {/* Header */}
        <div
          style={{
            position: "relative",
            paddingBottom: "12px",
            borderBottom: "1px solid #1E293B",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "4px",
              background: "linear-gradient(180deg, #A855F7, #00D2FF)",
              borderRadius: "4px",
            }}
          />
          <div
            style={{
              paddingLeft: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  color: "#64748B",
                  fontSize: "9px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                Structural Element
              </span>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: "#00D2FF",
                  marginTop: "2px",
                }}
              >
                Wall Matrix
              </div>
            </div>
            <span
              style={{
                fontSize: "10px",
                color: "#00D2FF",
                backgroundColor: "#0F172A",
                padding: "2px 6px",
                borderRadius: "4px",
                border: "1px solid #0284C7",
                flexShrink: 0,
              }}
            >
              {derived.groupId || "—"}
            </span>
          </div>
        </div>

        {/* Derived (read-only) section — UNCHANGED */}
        <div
          style={{
            backgroundColor: "#0B0F19",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #1E293B",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: "9px",
              fontWeight: "bold",
              color: "#64748B",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Wall Properties
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              minWidth: 0,
            }}
          >
            <ReadonlyField
              label="Length"
              value={`${length.toFixed(0)} mm`}
              accent="#00D2FF"
            />
            <ReadonlyField
              label="Height"
              value={`${derived.height.toFixed(0)} mm`}
              accent="#00D2FF"
            />
            <ReadonlyField
              label="Start"
              value={`${derived.startX.toFixed(0)}, ${derived.startY.toFixed(0)}`}
            />
            <ReadonlyField
              label="End"
              value={`${derived.endX.toFixed(0)}, ${derived.endY.toFixed(0)}`}
            />
            <ReadonlyField
              label="Wall Orientation"
              value={`${wallAngleDeg.toFixed(1)}°`}
            />
            <ReadonlyField
              label="Type"
              value={activeWallPayload.isRoomBorder ? "Room Border" : "Wall"}
            />
          </div>

          <div
            style={{
              fontSize: "9px",
              color: "#475569",
              lineHeight: 1.5,
              marginTop: 4,
            }}
          >
            Read-only. Set when the wall was drawn or imported. To change
            these, redraw the wall.
          </div>
        </div>

        {/* Metadata (editable) section — GATED */}
        <div
          style={{
            backgroundColor: "#0B0F19",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #1E293B",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            minWidth: 0,
            opacity: isReadOnly ? 0.6 : 1,
            transition: "opacity 0.15s",
          }}
          title={
            isReadOnly
              ? `Read-only: locked by ${lockedByUsername || "another user"}`
              : undefined
          }
        >
          <div
            style={{
              fontSize: "9px",
              fontWeight: "bold",
              color: "#64748B",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Metadata</span>
            {isReadOnly && (
              <span style={{ color: "#FFB800", fontSize: "9px" }}>
                🔒 READ-ONLY
              </span>
            )}
          </div>

          <EditableField label="Structural Thickness (mm)">
            <input
              type="number"
              value={thickness}
              disabled={isReadOnly}
              onChange={(e) => setThickness(e.target.value)}
              style={{
                ...textInputStyle,
                cursor: isReadOnly ? "not-allowed" : "text",
                opacity: isReadOnly ? 0.5 : 1,
              }}
              required
            />
          </EditableField>

          <EditableField label="Material">
            <select
              value={material}
              disabled={isReadOnly}
              onChange={(e) => setMaterial(e.target.value as MaterialOption)}
              style={{
                ...selectStyle,
                cursor: isReadOnly ? "not-allowed" : "pointer",
                opacity: isReadOnly ? 0.5 : 1,
              }}
            >
              {MATERIAL_OPTIONS.map((opt) => (
                <option
                  key={opt}
                  value={opt}
                  style={{ backgroundColor: "#06080F" }}
                >
                  {opt}
                </option>
              ))}
            </select>
          </EditableField>
        </div>

        <button
          type="submit"
          disabled={isReadOnly}
          title={
            isReadOnly
              ? `Read-only: locked by ${lockedByUsername || "another user"}`
              : undefined
          }
          style={{
            width: "100%",
            backgroundColor: isReadOnly
              ? "rgba(100, 116, 139, 0.06)"
              : "rgba(0, 210, 255, 0.06)",
            border: `1px solid ${isReadOnly ? "#334155" : "#00D2FF"}`,
            color: isReadOnly ? "#475569" : "#00D2FF",
            padding: "10px 0",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: "bold",
            textTransform: "uppercase",
            cursor: isReadOnly ? "not-allowed" : "pointer",
            letterSpacing: "0.05em",
            opacity: isReadOnly ? 0.6 : 1,
          }}
        >
          {isReadOnly ? "🔒 Commit Metadata" : "⚡ Commit Metadata"}
        </button>
      </form>
    </div>
  );
}

// ─── Small presentation helpers (unchanged) ──────────────────────────

function ReadonlyField({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: "9px", color: "#64748B" }}>{label}</span>
      <span
        style={{
          fontSize: "11px",
          color: accent ?? "#F1F5F9",
          fontWeight: "bold",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function EditableField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span
        style={{
          fontSize: "9px",
          color: "#64748B",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

const textInputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#06080F",
  border: "1px solid #1E293B",
  borderRadius: "6px",
  color: "#F1F5F9",
  fontSize: "11px",
  fontFamily: "monospace",
  padding: "6px 8px",
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...textInputStyle,
  cursor: "pointer",
};

export default WallInspector;