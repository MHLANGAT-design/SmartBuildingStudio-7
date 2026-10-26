import React from "react";
import { useAppSelector } from "@/Application/ConfigureStore";

interface DesignerMetricsRibbonProps {
  drawingDocument?: any;
  toolManager?: any;
}

export const DesignerMetricsRibbon: React.FC<DesignerMetricsRibbonProps> = () => {
  // 🚀 CONNECT TO THE SAME REDUX ENGINE AS COMPONENTEXPLORER
  const floorPlanState = useAppSelector((state: any) => state.floorPlan || {});
  const innerSlice = floorPlanState.activeFloorPlan || floorPlanState || {};
  const globalDoc = (window as any).__floorPlanActiveDocumentInstance;

  // Mirror ComponentExplorer's exact array resolution lookups
  let walls = innerSlice.customDrawnWalls || innerSlice.walls || innerSlice.Walls || floorPlanState.walls || [];
  if (!walls || walls.length === 0) walls = globalDoc?.customDrawnWalls || globalDoc?.walls || [];

  let doors = innerSlice.customDrawnDoors || innerSlice.doors || innerSlice.Doors || floorPlanState.doors || [];
  if (!doors || doors.length === 0) doors = globalDoc?.customDrawnDoors || globalDoc?.doors || [];

  let windows = innerSlice.customDrawnWindows || innerSlice.windows || innerSlice.Windows || floorPlanState.windows || [];
  if (!windows || windows.length === 0) windows = globalDoc?.customDrawnWindows || globalDoc?.windows || [];

  const currentUnits = innerSlice.units || floorPlanState.units || globalDoc?.units || "mm";
  const finalWallSegments = walls.filter((w: any) => !w?.isRoomBorder).length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", width: "100%", boxSizing: "border-box", userSelect: "none" }}>
      {[
        { label: "Vector Boundaries", val: `${finalWallSegments} Segments`, color: "#00D2FF", gl: "rgba(0,210,255,0.15)" },
        { label: "Aperture Openings", val: `${doors.length} Doors // ${windows.length} Win`, color: "#FFB800", gl: "rgba(255,184,0,0.15)" },
        { label: "Geometric Scale", val: `1.00 Unit == 1.00 ${currentUnits}`, color: "#05FFC4", gl: "rgba(5,255,196,0.15)" },
        { label: "Canvas Engine Buffer", val: "Telemetry Active", color: "#A855F7", gl: "rgba(168,85,247,0.15)" }
      ].map((card, idx) => (
        <div key={idx} style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid #1E293B", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", gap: "4px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: card.color, boxShadow: `0 0 8px ${card.color}` }} />
          <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.label}</span>
          <span style={{ fontSize: "13px", fontWeight: "bold", fontFamily: "monospace", color: card.color, textShadow: `0 0 10px ${card.gl}` }}>{card.val}</span>
        </div>
      ))}
    </div>
  );
};

export default DesignerMetricsRibbon;
