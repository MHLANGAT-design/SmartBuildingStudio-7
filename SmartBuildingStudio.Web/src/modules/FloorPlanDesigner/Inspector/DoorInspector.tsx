// src/modules/FloorPlanDesigner/Inspector/DoorInspector.tsx
//
// LEVEL 1 LOCK ENFORCEMENT: metadata card and commit button disabled
// when the document is locked by another user. Derived (read-only)
// fields and the reclassify panel (which gates itself) are unchanged.

import React, { useState, useEffect, useMemo, FormEvent } from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { setDocument } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { ReclassifyControls } from "./ReclassifyControls";
import { useFloorPlanLockState } from "@/modules/FloorPlanDesigner/hooks/useFloorPlanLockState";

interface DoorInspectorProps {
  selection?: any;
  pixelsPerMm?: number;
}

const DOOR_TYPE_OPTIONS = ["Single", "Double", "Sliding", "Pocket", "Revolving"] as const;
type DoorTypeOption = typeof DOOR_TYPE_OPTIONS[number];

const FIRE_RATING_OPTIONS = ["None", "FD30", "FD60", "FD90", "FD120"] as const;
type FireRatingOption = typeof FIRE_RATING_OPTIONS[number];

export function DoorInspector({ selection, pixelsPerMm = 0.05 }: DoorInspectorProps) {
  const dispatch = useAppDispatch();
  const floorPlanState = useAppSelector((state: any) => state.floorPlan || {});
  const { isReadOnly, lockedByUsername } = useFloorPlanLockState();

  const globalDoc = (window as any).__floorPlanActiveDocumentInstance;
  const currentDoorsPool = useMemo(() => {
    const redux = floorPlanState.document?.doors;
    if (Array.isArray(redux) && redux.length > 0) return redux;
    const gd = globalDoc?.doors;
    if (Array.isArray(gd) && gd.length > 0) return gd;
    const gdAlt = globalDoc?._doors;
    if (Array.isArray(gdAlt) && gdAlt.length > 0) return gdAlt;
    return [];
  }, [floorPlanState.document?.doors, globalDoc?.doors, globalDoc?._doors]);

  const activeDoorPayload = useMemo(() => {
    const selectionId = selection?.id ?? selection?.Id;
    if (selectionId) {
      const fresh = currentDoorsPool.find(
        (d: any) => String(d.id ?? d.Id) === String(selectionId)
      );
      return fresh ?? selection;
    }
    if (currentDoorsPool.length > 0) {
      return currentDoorsPool[currentDoorsPool.length - 1];
    }
    return null;
  }, [selection, currentDoorsPool]);

  const [name, setName] = useState("");
  const [doorType, setDoorType] = useState<DoorTypeOption>("Single");
  const [fireRating, setFireRating] = useState<FireRatingOption>("None");
  const [material, setMaterial] = useState("Timber");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!activeDoorPayload) return;
    setName(String(activeDoorPayload.name ?? ""));
    const dt = String(
      activeDoorPayload.doorType ?? activeDoorPayload.properties?.doorType ?? ""
    );
    setDoorType(
      (DOOR_TYPE_OPTIONS as readonly string[]).includes(dt)
        ? (dt as DoorTypeOption)
        : activeDoorPayload.properties?.isDouble ? "Double" : "Single"
    );
    const fr = String(
      activeDoorPayload.fireRating ?? activeDoorPayload.properties?.fireRating ?? "None"
    );
    setFireRating(
      (FIRE_RATING_OPTIONS as readonly string[]).includes(fr)
        ? (fr as FireRatingOption) : "None"
    );
    setMaterial(String(
      activeDoorPayload.material ?? activeDoorPayload.properties?.material ?? "Timber"
    ));
    setNotes(String(
      activeDoorPayload.notes ?? activeDoorPayload.properties?.notes ?? ""
    ));
  }, [activeDoorPayload]);

  if (!activeDoorPayload) return null;

  const derived = {
    openingWidth: Number(activeDoorPayload.properties?.openingWidth ?? activeDoorPayload.width ?? 0),
    leafWidth: Number(activeDoorPayload.width ?? 0),
    height: Number(activeDoorPayload.height ?? 2100),
    hingeX: Number(activeDoorPayload.hingeX ?? activeDoorPayload.x ?? 0),
    hingeY: Number(activeDoorPayload.hingeY ?? activeDoorPayload.y ?? 0),
    wallAngleRad: Number(activeDoorPayload.wallAngle ?? 0),
    wallAngleDeg: ((Number(activeDoorPayload.wallAngle ?? 0) * 180) / Math.PI) % 360,
    isLeftHand: Boolean(activeDoorPayload.isLeftHand),
    isOutward: Boolean(activeDoorPayload.isOutward),
    isDouble: Boolean(activeDoorPayload.properties?.isDouble),
    variant: String(activeDoorPayload.properties?.variant ?? ""),
    blockName: String(activeDoorPayload.properties?.blockName ?? ""),
    groupId: String(activeDoorPayload.id ?? activeDoorPayload.Id ?? ""),
  };
  const canvasPxWidth = Math.round(derived.openingWidth * pixelsPerMm);
  const canvasPxHeight = Math.round(derived.height * pixelsPerMm);

  const doorTypeLabel: string = (() => {
    switch (derived.variant) {
      case "double":  return "Double";
      case "single":  return "Single";
      case "sliding": return "Sliding";
      case "folding": return "Folding";
      case "opening": return "Opening";
      case "other":   return "Other";
      default:        return derived.isDouble ? "Double" : "Single";
    }
  })();

  const blockNameShort = derived.blockName ? derived.blockName.split(" - ")[0] : "";

  const handleCommit = (e: FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!activeDoorPayload) return;

    const id = String(activeDoorPayload.id || activeDoorPayload.Id);

    const updatedDoorPayload = {
      ...activeDoorPayload,
      id,
      name: name.trim() || undefined,
      doorType,
      fireRating,
      material,
      notes: notes.trim() || undefined,
      hingeX: derived.hingeX,
      hingeY: derived.hingeY,
      wallAngle: derived.wallAngleRad,
      width: derived.leafWidth,
      height: derived.height,
      isOutward: derived.isOutward,
      isLeftHand: derived.isLeftHand,
      properties: {
        ...(activeDoorPayload.properties || {}),
        doorType,
        fireRating,
        material,
        notes: notes.trim() || undefined,
        lastModified: Date.now(),
      },
    };

    const updatedDoorsPool = currentDoorsPool.map((door: any) =>
      String(door.id || door.Id) === id ? updatedDoorPayload : door
    );

    if (globalDoc) globalDoc.doors = updatedDoorsPool;

    if (floorPlanState.document) {
      dispatch(setDocument({ ...floorPlanState.document, doors: updatedDoorsPool }));
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
      <ReclassifyControls elementId={derived.groupId} current="door" />

      <form
        onSubmit={handleCommit}
        style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}
      >
        {/* Header */}
        <div style={{ position: "relative", paddingBottom: "12px", borderBottom: "1px solid #1E293B" }}>
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: "4px",
            background: "linear-gradient(180deg, #A855F7, #EAB308)", borderRadius: "4px",
          }} />
          <div style={{
            paddingLeft: "12px", display: "flex", justifyContent: "space-between",
            alignItems: "center", gap: "8px",
          }}>
            <div style={{ minWidth: 0 }}>
              <span style={{
                color: "#64748B", fontSize: "9px", fontWeight: "bold",
                textTransform: "uppercase",
              }}>Ingress Aperture</span>
              <div style={{
                fontSize: "13px", fontWeight: "bold", color: "#EAB308", marginTop: "2px",
              }}>Doorway Matrix</div>
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
          }}>Door Properties</div>

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", minWidth: 0,
          }}>
            <ReadonlyField label="Opening Width" value={`${derived.openingWidth.toFixed(0)} mm`} accent="#EAB308" />
            <ReadonlyField label="Canvas Footprint" value={`${canvasPxWidth} px`} accent="#38BDF8" />
            <ReadonlyField label="Opening Height" value={`${derived.height.toFixed(0)} mm`} accent="#EAB308" />
            <ReadonlyField label="Canvas Height" value={`${canvasPxHeight} px`} accent="#38BDF8" />
            <ReadonlyField label="Hinge X" value={derived.hingeX.toFixed(1)} />
            <ReadonlyField label="Hinge Y" value={derived.hingeY.toFixed(1)} />
            <ReadonlyField label="Wall Orientation" value={`${derived.wallAngleDeg.toFixed(1)}°`} />
            <ReadonlyField label="Handedness" value={derived.isLeftHand ? "Left Hand" : "Right Hand"} />
            <ReadonlyField label="Swing Direction" value={derived.isOutward ? "Outward" : "Inward"} />
            <ReadonlyField label="Door Type" value={doorTypeLabel} />
          </div>

          {blockNameShort ? (
            <FullWidthField label="Source Block" value={blockNameShort} title={derived.blockName} />
          ) : null}

          <div style={{ fontSize: "9px", color: "#475569", lineHeight: 1.5, marginTop: 4 }}>
            Read-only. Set when the door was created or imported. To change these, redraw the door.
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
          title={
            isReadOnly
              ? `Read-only: locked by ${lockedByUsername || "another user"}`
              : undefined
          }
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
            <input
              type="text"
              value={name}
              disabled={isReadOnly}
              onChange={(e) => setName(e.target.value)}
              placeholder={derived.groupId || "Unnamed Door"}
              style={{
                ...textInputStyle,
                cursor: isReadOnly ? "not-allowed" : "text",
                opacity: isReadOnly ? 0.5 : 1,
              }}
            />
          </EditableField>

          <EditableField label="Door Type">
            <select
              value={doorType}
              disabled={isReadOnly}
              onChange={(e) => setDoorType(e.target.value as DoorTypeOption)}
              style={{
                ...selectStyle,
                cursor: isReadOnly ? "not-allowed" : "pointer",
                opacity: isReadOnly ? 0.5 : 1,
              }}
            >
              {DOOR_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt} style={{ backgroundColor: "#06080F" }}>
                  {opt}
                </option>
              ))}
            </select>
          </EditableField>

          <EditableField label="Fire Rating">
            <select
              value={fireRating}
              disabled={isReadOnly}
              onChange={(e) => setFireRating(e.target.value as FireRatingOption)}
              style={{
                ...selectStyle,
                cursor: isReadOnly ? "not-allowed" : "pointer",
                opacity: isReadOnly ? 0.5 : 1,
              }}
            >
              {FIRE_RATING_OPTIONS.map((opt) => (
                <option key={opt} value={opt} style={{ backgroundColor: "#06080F" }}>
                  {opt === "None" ? "—" : opt}
                </option>
              ))}
            </select>
          </EditableField>

          <EditableField label="Material">
            <input
              type="text"
              value={material}
              disabled={isReadOnly}
              onChange={(e) => setMaterial(e.target.value)}
              style={{
                ...textInputStyle,
                cursor: isReadOnly ? "not-allowed" : "text",
                opacity: isReadOnly ? 0.5 : 1,
              }}
            />
          </EditableField>

          <EditableField label="Notes">
            <textarea
              value={notes}
              disabled={isReadOnly}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{
                ...textInputStyle,
                resize: "vertical" as const,
                cursor: isReadOnly ? "not-allowed" : "text",
                opacity: isReadOnly ? 0.5 : 1,
              }}
            />
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
              : "rgba(234, 179, 8, 0.06)",
            border: `1px solid ${isReadOnly ? "#334155" : "#EAB308"}`,
            color: isReadOnly ? "#475569" : "#EAB308",
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

// ─── Presentation helpers (unchanged from original) ─────────────────
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

export default DoorInspector;