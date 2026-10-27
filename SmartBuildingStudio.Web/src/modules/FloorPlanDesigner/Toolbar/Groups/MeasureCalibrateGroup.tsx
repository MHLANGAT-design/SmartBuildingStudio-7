// src/modules/FloorPlanDesigner/Toolbar/Groups/MeasureCalibrateGroup.tsx
import React from "react";
import { useAppDispatch, useAppSelector } from "@/Application/ConfigureStore";
import { setActiveTool, FloorPlanTool } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

export const MeasureCalibrateGroup: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
  const dispatch = useAppDispatch();
  const activeTool = useAppSelector((s: any) => s.floorPlan?.activeTool ?? "select") as FloorPlanTool;
  const calibration = useAppSelector((s: any) => s.floorPlan?.calibration);
  const measurements = useAppSelector((s: any) => s.floorPlan?.measurements);

  const toggle = (tool: FloorPlanTool) => {
    dispatch(setActiveTool(activeTool === tool ? "select" : tool));
    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
  };

  const btn = (tool: FloorPlanTool, label: string, icon: string, color: string) => {
    const active = activeTool === tool;
    return (
      <button
        type="button"
        disabled={isReadOnly}
        onClick={() => toggle(tool)}
        style={{
          background: active ? `${color}22` : "rgba(30,41,59,0.2)",
          border: `1px solid ${active ? color : "#1E293B"}`,
          color: active ? color : "#94A3B8",
          padding: "6px 12px",
          borderRadius: "6px",
          fontFamily: "monospace",
          fontSize: "10px",
          fontWeight: "bold",
          textTransform: "uppercase",
          cursor: isReadOnly ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          letterSpacing: "0.05em",
        }}
        title={`${label} tool`}
      >
        <span>{icon}</span><span>{label}</span>
        {tool === "calibration" && calibration?.pxPerUnit != null && (
          <span style={{ fontSize: "8px", color: "#F59E0B" }}>✓</span>
        )}
        {tool === "measure" && measurements?.committed?.length > 0 && (
          <span style={{ fontSize: "8px", color: "#22D3EE" }}>
            {measurements.committed.length}
          </span>
        )}
      </button>
    );
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      {btn("calibration", "Calibrate", "📏", "#F59E0B")}
      {btn("measure", "Measure", "📐", "#22D3EE")}
      {calibration?.pxPerUnit != null && (
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => {
            dispatch({ type: "floorPlan/resetCalibration" });
            window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
          }}
          style={{ background: "transparent", border: "1px solid #475569", color: "#64748B",
            padding: "6px 10px", borderRadius: "6px", fontFamily: "monospace", fontSize: "9px",
            cursor: isReadOnly ? "not-allowed" : "pointer" }}
          title="Reset calibration"
        >
          Reset Cal
        </button>
      )}
      {measurements?.committed?.length > 0 && (
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => {
            dispatch({ type: "floorPlan/clearMeasurements" });
            window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
          }}
          style={{ background: "transparent", border: "1px solid #475569", color: "#64748B",
            padding: "6px 10px", borderRadius: "6px", fontFamily: "monospace", fontSize: "9px",
            cursor: isReadOnly ? "not-allowed" : "pointer" }}
          title="Clear measurements"
        >
          Clear Meas
        </button>
      )}
    </div>
  );
};

export default MeasureCalibrateGroup;