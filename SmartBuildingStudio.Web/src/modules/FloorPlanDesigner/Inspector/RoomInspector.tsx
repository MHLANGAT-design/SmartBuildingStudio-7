// src/modules/FloorPlanDesigner/Inspector/RoomInspector.tsx
//
// LEVEL 1 LOCK ENFORCEMENT: zone name, target lux, DALI group, and the
// commit button disabled when the document is locked by another user.
// Points display and readout stay visible (they're read-only already).

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { store } from "@/Application/ConfigureStore";
import { markDirty, setSelection, setDocument } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { useFloorPlanLockState } from "@/modules/FloorPlanDesigner/hooks/useFloorPlanLockState";

interface RoomInspectorProps {
  selection: any;
}

export function RoomInspector({ selection }: RoomInspectorProps) {
  const dispatch = useAppDispatch();
  const { isReadOnly, lockedByUsername } = useFloorPlanLockState();

  const floorPlanState = useAppSelector((state: any) => state.floorPlan || {});
  const documentState = floorPlanState.document || {};
  const reduxRooms = documentState.rooms || [];
  const reduxElements = documentState.elements || [];

  const globalDoc = (window as any).__floorPlanActiveDocumentInstance;
  const globalRooms = globalDoc?.rooms || [];

  const [roomName, setRoomName] = useState("");
  const [targetLux, setTargetLux] = useState<number>(500);
  const [daliGroup, setDaliGroup] = useState<number>(1);
  const [pointCount, setPointCount] = useState<number>(0);
  const [pointsDisplay, setPointsDisplay] = useState<string>("");
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string>("");

  const lastSyncedRoomIdRef = useRef<string | null>(null);

  const activeRoomPayload = useMemo(() => {
    const selId = String(selection?.id ?? selection?.Id ?? "");
    const fromElements = selId
      ? reduxElements.find(
          (e: any) =>
            String(e.id ?? e.Id ?? "") === selId &&
            (e.isRoom || String(e.type ?? "").toLowerCase() === "room")
        )
      : null;
    const fromRooms = selId
      ? reduxRooms.find((r: any) => String(r.id ?? r.Id ?? "") === selId)
      : null;

    if (fromElements && selection) {
      const pts = fromElements.points || fromRooms?.points || selection.points || [];
      return { ...fromElements, ...fromRooms, ...selection, points: pts, vertices: pts };
    }
    if (fromElements) return fromElements;
    if (fromRooms && selection) {
      const pts = fromRooms.points || selection.points || [];
      return { ...fromRooms, ...selection, points: pts, vertices: pts };
    }
    if (selection) return selection;
    if (reduxRooms.length > 0) return reduxRooms[reduxRooms.length - 1];
    if (globalRooms.length > 0) return globalRooms[globalRooms.length - 1];
    return null;
  }, [selection, reduxElements, reduxRooms, globalRooms]);

  useEffect(() => {
    if (!activeRoomPayload) return;
    const payloadId = String(activeRoomPayload.id ?? activeRoomPayload.Id ?? "");
    const points = activeRoomPayload.points || activeRoomPayload.vertices || [];
    const roomChanged = lastSyncedRoomIdRef.current !== payloadId;

    if (roomChanged) {
      lastSyncedRoomIdRef.current = payloadId;
      setRoomId(payloadId);
      setRoomName(activeRoomPayload.name || payloadId || "CONTROL ZONE");
      setTargetLux(Number(activeRoomPayload.targetLux ?? 500));
      setDaliGroup(Number(activeRoomPayload.primaryGroup ?? 1));
    }

    setPointCount(points.length);
    if (points.length > 0) {
      setPointsDisplay(
        points
          .map(
            (p: any, i: number) =>
              `P${i + 1}: (${Number(p.x ?? 0).toFixed(2)}, ${Number(p.y ?? 0).toFixed(2)})`
          )
          .join("  ")
      );
    } else {
      setPointsDisplay("⚠️ No points captured!");
    }
  }, [activeRoomPayload]);

  if (!activeRoomPayload) {
    return (
      <div style={{ padding: "20px", color: "#64748B", textAlign: "center" }}>
        <div style={{ fontSize: "12px" }}>No room selected</div>
        <div style={{ fontSize: "10px", marginTop: "8px" }}>Draw a room using the Room Tool</div>
      </div>
    );
  }

  const handleUpdateRoomMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!activeRoomPayload || isCommitting) return;

    const points = activeRoomPayload.points || activeRoomPayload.vertices || [];
    if (points.length === 0) {
      console.warn("[RoomInspector] Room has no points — cannot commit.");
      return;
    }

    setIsCommitting(true);

    try {
      const formattedPoints = points.map((p: any) => ({
        x: Number(p.x ?? 0),
        y: Number(p.y ?? 0),
      }));

      const targetRoomId = String(
        activeRoomPayload.id ?? activeRoomPayload.Id ?? roomId
      );

      const updatedRoomPayload: any = {
        ...activeRoomPayload,
        id: targetRoomId,
        type: "room",
        isRoom: true,
        name: roomName.trim(),
        points: formattedPoints,
        vertices: formattedPoints,
        targetLux: targetLux,
        primaryGroup: daliGroup,
        fillStyle: activeRoomPayload.fillStyle || "rgba(74, 222, 128, 0.15)",
        strokeStyle: activeRoomPayload.strokeStyle || "#4ADE80",
        layer: "rooms",
      };

      const freshState = store.getState();
      const freshDoc = freshState.floorPlan?.document || {};
      const currentRooms = Array.isArray(freshDoc.rooms) ? freshDoc.rooms : [];
      const currentElements = Array.isArray(freshDoc.elements) ? freshDoc.elements : [];

      const matchId = (x: any) => String(x?.id ?? x?.Id ?? "") === targetRoomId;

      const nextRooms = currentRooms.some(matchId)
        ? currentRooms.map((r: any) => (matchId(r) ? updatedRoomPayload : r))
        : [...currentRooms, updatedRoomPayload];

      const isRoomElement = (el: any) =>
        matchId(el) && (el.isRoom || String(el.type ?? "").toLowerCase() === "room");

      const nextElements = currentElements.some(isRoomElement)
        ? currentElements.map((el: any) => (isRoomElement(el) ? updatedRoomPayload : el))
        : [...currentElements, updatedRoomPayload];

      dispatch(setDocument({
        ...freshDoc,
        elements: nextElements,
        rooms: nextRooms,
      }));

      const win = window as any;
      win.__floorPlanActiveDocumentInstance = {
        ...(win.__floorPlanActiveDocumentInstance || {}),
        ...freshDoc,
        elements: nextElements,
        rooms: nextRooms,
      };

      dispatch(setSelection(updatedRoomPayload));
      dispatch(markDirty());

      window.dispatchEvent(new CustomEvent("sbs:cad-commit-success"));
      window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
      window.dispatchEvent(new CustomEvent("canvas-invalidate"));
    } catch (error) {
      console.error("[RoomInspector] Commit failed:", error);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <form onSubmit={handleUpdateRoomMetadata} style={{
      display: "flex", flexDirection: "column", gap: "16px",
      fontFamily: "monospace", fontSize: "12px", color: "#E2E8F0",
    }}>
      {/* Header */}
      <div style={{ position: "relative", paddingBottom: "12px", borderBottom: "1px solid #1E293B" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: "4px",
          background: "linear-gradient(180deg, #A855F7, #00D2FF)", borderRadius: "4px",
        }} />
        <div style={{ paddingLeft: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div>
            <span style={{
              color: "#64748B", fontSize: "9px", textTransform: "uppercase",
              fontWeight: "bold", letterSpacing: "0.1em",
            }}>Selected Element Type</span>
            <div style={{
              fontSize: "13px", fontWeight: "bold", color: "#05FFC4",
              marginTop: "2px", letterSpacing: "0.05em", textTransform: "uppercase",
            }}>Spatial Zone // Room Profile</div>
          </div>
          {isReadOnly && (
            <span
              style={{
                fontSize: 9, color: "#FFB800",
                background: "rgba(255,184,0,0.12)",
                border: "1px solid rgba(255,184,0,0.4)",
                borderRadius: 4, padding: "2px 6px",
                fontFamily: "monospace", fontWeight: "bold",
                letterSpacing: "0.05em",
              }}
              title={`Locked by ${lockedByUsername || "another user"}`}
            >🔒 READ-ONLY</span>
          )}
        </div>
      </div>

      <div style={{
        backgroundColor: "#0B0F19", padding: "16px", borderRadius: "12px",
        border: "1px solid #1E293B", display: "flex", flexDirection: "column",
        gap: "16px",
        opacity: isReadOnly ? 0.7 : 1, transition: "opacity 0.15s",
      }}>
        {/* Points captured — read-only, always visible */}
        <div style={{
          display: "flex", flexDirection: "column", gap: "4px",
          backgroundColor: "#06080F", padding: "8px 12px", borderRadius: "6px",
          border: "1px solid #1E293B",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{
              color: "#64748B", fontSize: "9px", fontWeight: "bold",
              textTransform: "uppercase",
            }}>Points Captured</span>
            <span style={{ color: pointCount > 0 ? "#05FFC4" : "#EF4444", fontWeight: "bold" }}>
              {pointCount > 0 ? `✅ ${pointCount} points` : "⚠️ No points"}
            </span>
          </div>
          {pointsDisplay && (
            <div style={{
              fontSize: "8px", color: "#475569", fontFamily: "monospace",
              wordBreak: "break-all", maxHeight: "40px", overflow: "auto",
            }}>{pointsDisplay}</div>
          )}
        </div>

        {/* Name — GATED */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{
            color: "#64748B", fontSize: "10px", fontWeight: "bold",
            textTransform: "uppercase",
          }}>Zone Identifier Alias</span>
          <input
            type="text"
            value={roomName}
            disabled={isReadOnly}
            onChange={(e) => setRoomName(e.target.value)}
            style={{
              width: "100%", backgroundColor: "#06080F",
              border: "1px solid #1E293B", borderRadius: "8px",
              padding: "8px 12px", fontSize: "12px", color: "#05FFC4",
              outline: "none", boxSizing: "border-box",
              cursor: isReadOnly ? "not-allowed" : "text",
              opacity: isReadOnly ? 0.5 : 1,
            }}
            required
          />
        </div>

        {/* Target lux — GATED */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{
            color: "#64748B", fontSize: "10px", fontWeight: "bold",
            textTransform: "uppercase",
          }}>Required Operational Target Lux</span>
          <select
            value={targetLux}
            disabled={isReadOnly}
            onChange={(e) => setTargetLux(Number(e.target.value))}
            style={{
              width: "100%", backgroundColor: "#06080F",
              border: "1px solid #1E293B", borderRadius: "8px",
              padding: "8px 12px", fontSize: "12px", color: "#ffffff",
              outline: "none", boxSizing: "border-box",
              cursor: isReadOnly ? "not-allowed" : "pointer",
              opacity: isReadOnly ? 0.5 : 1,
            }}
          >
            <option value="150">Corridors &amp; Transit Zones (150 lx)</option>
            <option value="300">General Workstations &amp; Tasking (300 lx)</option>
            <option value="500">Precision Office &amp; Cad Work (500 lx)</option>
            <option value="750">Precision Inspection Labs (750 lx)</option>
          </select>
        </div>

        {/* DALI group — GATED */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{
            color: "#64748B", fontSize: "10px", fontWeight: "bold",
            textTransform: "uppercase",
          }}>Primary Assigned DALI Group Address</span>
          <div style={{ position: "relative", width: "100%" }}>
            <span style={{
              position: "absolute", left: "12px", top: "8px",
              fontSize: "12px", fontWeight: "bold", color: "#00D2FF",
            }}>G_</span>
            <input
              type="number"
              min="0"
              max="15"
              value={daliGroup}
              disabled={isReadOnly}
              onChange={(e) => setDaliGroup(Number(e.target.value))}
              style={{
                width: "100%", backgroundColor: "#06080F",
                border: "1px solid #1E293B", borderRadius: "8px",
                padding: "8px 12px 8px 32px", fontSize: "12px", color: "#ffffff",
                outline: "none", boxSizing: "border-box",
                cursor: isReadOnly ? "not-allowed" : "text",
                opacity: isReadOnly ? 0.5 : 1,
              }}
              required
            />
          </div>
          <p style={{
            textTransform: "none", fontFamily: "sans-serif", fontSize: "10px",
            color: "#475569", margin: "4px 0 0 0", lineHeight: "1.4",
          }}>
            Maps ballast circuits directly to a physical DALI hardware broadcast index (0 – 15).
          </p>
        </div>

        {/* Readout — unchanged */}
        <div style={{
          borderTop: "1px solid #1E293B", fontSize: "11px", color: "#94A3B8",
          backgroundColor: "#090D16", borderRadius: "8px", padding: "12px",
          border: "1px solid rgba(30,41,59,0.6)", display: "flex",
          flexDirection: "column", gap: "6px", marginTop: "4px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>POINT COUNT:</span>
            <span style={{ color: pointCount > 0 ? "#05FFC4" : "#EF4444", fontWeight: "bold" }}>
              {pointCount || 0}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>TARGET LUX:</span>
            <span style={{ color: "#05FFC4", fontWeight: "bold" }}>{targetLux} lx</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>DALI GROUP:</span>
            <span style={{ color: "#00D2FF", fontWeight: "bold" }}>G_{daliGroup}</span>
          </div>
        </div>
      </div>

      {/* Commit — GATED */}
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button
          type="submit"
          disabled={isCommitting || pointCount === 0 || isReadOnly}
          title={isReadOnly
            ? `Read-only: locked by ${lockedByUsername || "another user"}` : undefined}
          style={{
            flex: 1,
            backgroundColor:
              isReadOnly ? "rgba(100, 116, 139, 0.06)"
                : pointCount === 0 ? "rgba(127, 29, 29, 0.2)"
                  : "rgba(5, 255, 196, 0.06)",
            border:
              isReadOnly ? "1px solid #334155"
                : pointCount === 0 ? "1px solid #7F1D1D"
                  : "1px solid #05FFC4",
            color:
              isReadOnly ? "#475569"
                : pointCount === 0 ? "#7F1D1D"
                  : "#05FFC4",
            padding: "10px 0", borderRadius: "8px", fontSize: "11px",
            fontWeight: "bold", textTransform: "uppercase",
            cursor: (isCommitting || pointCount === 0 || isReadOnly) ? "not-allowed" : "pointer",
            outline: "none", letterSpacing: "0.05em", transition: "all 0.15s",
            opacity: isCommitting ? 0.5 : isReadOnly ? 0.6 : 1,
          }}
        >
          {isReadOnly ? "🔒 Commit Room" : isCommitting ? "⏳ Committing..." : "⚡ Commit Room"}
        </button>
      </div>

      {pointCount === 0 && (
        <div style={{
          padding: "8px 12px", backgroundColor: "rgba(127, 29, 29, 0.1)",
          border: "1px solid #7F1D1D", borderRadius: "6px",
          color: "#F87171", fontSize: "10px",
        }}>
          ⚠️ No points captured! Draw the room using the Room Tool first.
        </div>
      )}
    </form>
  );
}

export default RoomInspector;