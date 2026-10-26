import React, { useState, useEffect, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";

export default function PropertiesPanel() {
  const dispatch = useAppDispatch() as any;
  const floorPlanState = useAppSelector((state: any) => state.floorPlan || {});
  const { selection } = floorPlanState;

  // Local text input parameter strings preserve clean workspace focus updates
  const [roomName, setRoomName] = useState("");
  const [targetLux, setTargetLux] = useState<number>(500);

  const activeState = useAppSelector((state: any) => state.floorPlan || {});
  const innerSlice = activeState?.activeFloorPlan || activeState || {};
  const globalDoc = (window as any).__floorPlanActiveDocumentInstance || {};

  // Resolve raw arrays from state or global window context caches
  const rawWalls = innerSlice.walls || innerSlice.Walls || floorPlanState.walls || globalDoc.walls || [];
  const rawDoors = innerSlice.doors || innerSlice.Doors || floorPlanState.doors || globalDoc.doors || [];
  const rawWindows = innerSlice.windows || innerSlice.Windows || floorPlanState.windows || globalDoc.windows || [];
  const currentRoomsPool = innerSlice.rooms || innerSlice.Rooms || floorPlanState.rooms || globalDoc.rooms || [];

  // 🚀 TRUE ELEMENT COUNTS: Deduplicate blown-up DXF primitive arrays by root handles
  const totalTrueWalls = useMemo(() => {
    return rawWalls.filter((w: any) => !w?.isRoomBorder).length;
  }, [rawWalls]);

  const totalTrueDoors = useMemo(() => {
    const seen = new Set<string>();
    return rawDoors.filter((d: any) => {
      if (!d?.id) return false;
      const baseId = d.id.split('_sub_')[0];
      if (seen.has(baseId)) return false;
      seen.add(baseId);
      return true;
    }).length;
  }, [rawDoors]);

  const totalTrueWindows = useMemo(() => {
    const seen = new Set<string>();
    return rawWindows.filter((w: any) => {
      if (!w?.id) return false;
      const baseId = w.id.split('_sub_')[0];
      if (seen.has(baseId)) return false;
      seen.add(baseId);
      return true;
    }).length;
  }, [rawWindows]);

  // Determine if our selection reference parameter targets an open room boundary footprint
  const activeRoomPayload = useMemo(() => {
    if (selection && (selection.vertices || selection.Vertices || selection.metadata)) {
      return selection;
    }
    if (currentRoomsPool.length > 0) {
      return currentRoomsPool[currentRoomsPool.length - 1];
    }
    return null;
  }, [selection, currentRoomsPool]);

  useEffect(() => {
    if (activeRoomPayload) {
      setRoomName(activeRoomPayload.name || activeRoomPayload.id || "OFFICE LAYOUT");
      setTargetLux(Number(activeRoomPayload.metadata?.requiredLux || activeRoomPayload.requiredLux || 500));
    }
  }, [activeRoomPayload]);

  const handleUpdateRoomMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoomPayload) return;
    
    const updatedRoomPayload = {
      ...activeRoomPayload,
      name: roomName.trim(),
      metadata: {
        ...(activeRoomPayload.metadata || {}),
        requiredLux: Number(targetLux)
      }
    };
    
    const updatedRoomsPool = currentRoomsPool.map((room: any) =>
      (room.id === activeRoomPayload.id) ? updatedRoomPayload : room
    );

    // Backplane runtime global document cache sync loop updates
    if ((window as any).__floorPlanActiveDocumentInstance) {
      (window as any).__floorPlanActiveDocumentInstance.rooms = updatedRoomsPool;
    }
    
    dispatch({
      type: "floorPlan/loadFloorPlan/fulfilled",
      payload: {
        ...innerSlice,
        rooms: updatedRoomsPool
      }
    });
    
    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
    window.dispatchEvent(new CustomEvent("canvas-invalidate"));
  };

  return (
    <div className="space-y-4" style={{ fontFamily: "monospace", padding: "10px", width: "100%", boxSizing: "border-box" }}>
      {activeRoomPayload ? (
        /* 🚀 REPLICATED ROOM SYSTEM PARAMETERS CARD DECK VIEW */
        <form onSubmit={handleUpdateRoomMetadata} className="space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs" style={{ padding: "14px", background: "#0B0F19", borderRadius: "12px", border: "1px solid #1E293B", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="border-b border-slate-800 pb-2" style={{ borderBottom: "1px solid #1E293B", paddingBottom: "8px" }}>
            <span className="text-slate-500" style={{ color: "#64748B", fontSize: "10px" }}>SELECTED OBJECT ELEMENT TYPE:</span>
            <div className="text-sm font-bold text-emerald-400 mt-0.5 uppercase tracking-wide" style={{ fontSize: "13px", fontWeight: "bold", color: "#05FFC4", marginTop: "2px" }}>
              SPATIAL ZONE PROFILE // ROOM
            </div>
          </div>
          
          <div className="space-y-2" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="flex flex-col gap-1" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span className="text-slate-500 text-[10px] uppercase" style={{ color: "#64748B", fontSize: "10px" }}>Room Description Name</span>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                style={{ width: "100%", backgroundColor: "#06080F", border: "1px solid #1E293B", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", color: "#05FFC4", outline: "none", boxSizing: "border-box" }}
                required
              />
            </div>
            
            <div className="flex flex-col gap-1 pt-1" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span className="text-slate-500 text-[10px] uppercase" style={{ color: "#64748B", fontSize: "10px" }}>Target Illuminance (Lux)</span>
              <input
                type="number"
                value={targetLux}
                onChange={(e) => setTargetLux(Number(e.target.value))}
                min={50}
                max={2000}
                style={{ width: "100%", backgroundColor: "#06080F", border: "1px solid #1E293B", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", color: "#ffffff", outline: "none", boxSizing: "border-box" }}
                required
              />
            </div>
          </div>
          
          <div className="pt-2 border-t border-slate-800/60 space-y-1.5 text-[11px]" style={{ fontSize: "11px", color: "#94A3B8", background: "#090D16", border: "1px solid #1E293B", borderRadius: "8px", padding: "10px", display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
            <div className="flex justify-between" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>CALCULATED SPACE AREA:</span>
              <span style={{ color: "#ffffff", fontWeight: "bold" }}>{activeRoomPayload.metadata?.areaM2 || "0.00"} m²</span>
            </div>
            <div className="flex justify-between" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>FUNCTIONAL PROFILE:</span>
              <span style={{ color: "#64748B" }}>{(activeRoomPayload.metadata?.spaceType || "OFFICE").toUpperCase()}</span>
            </div>
            {/* Added readouts using true calculated counts for the active workspace context tracking */}
            <div className="flex justify-between border-t border-slate-800/40 pt-1.5 mt-1" style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(30,41,59,0.4)", paddingTop: "6px" }}>
              <span>TOTAL ACTIVE WALLS:</span>
              <span style={{ color: "#ffffff" }}>{totalTrueWalls}</span>
            </div>
            <div className="flex justify-between" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>TOTAL ACTIVE DOORS:</span>
              <span style={{ color: "#ffffff" }}>{totalTrueDoors}</span>
            </div>
            <div className="flex justify-between" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>TOTAL ACTIVE WINDOWS:</span>
              <span style={{ color: "#ffffff" }}>{totalTrueWindows}</span>
            </div>
          </div>
          
          <button
            type="submit"
            style={{ width: "100%", background: "rgba(5, 255, 196, 0.1)", border: "1px solid #05FFC4", color: "#05FFC4", padding: "8px 0", borderRadius: "6px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", cursor: "pointer", outline: "none", marginTop: "4px" }}
          >
            ⚡ Commit Parameter Changes
          </button>
        </form>
      ) : (
        /* FALLBACK REPLICA CONTAINER DECK FOR HARDWARE NODES OR EMPTY WORKSPACE PANELS */
        <div className="p-4 border border-dashed border-slate-800 rounded-lg text-center text-xs text-slate-500" style={{ padding: "20px", border: "1px dashed #1E293B", borderRadius: "12px", background: "rgba(9,13,22,0.1)", textAlign: "center", fontSize: "11px", color: "#475569", lineHeight: "1.5" }}>
          No custom drawn rooms or automation network hardware objects currently exist inside this workspace loop allocation layer.<br />
          <span style={{ color: "#05FFC4" }}>Select the Room tool to begin sketch layout tracks.</span>
        </div>
      )}
    </div>
  );
}
