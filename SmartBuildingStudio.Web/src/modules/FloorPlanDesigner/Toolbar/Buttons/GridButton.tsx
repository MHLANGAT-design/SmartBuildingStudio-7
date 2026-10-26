// src/modules/FloorPlanDesigner/Toolbar/Buttons/GridButton.tsx
import React from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { toggleLayer } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

export const GridButton: React.FC = () => {
  const dispatch = useAppDispatch();
  // Read grid visibility from Redux layers
  const gridVisible = useAppSelector((state) => state.floorPlan.layers.grid);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();

    // Toggle the grid layer in Redux
    dispatch(toggleLayer("grid"));

    // Also update global hidden layers map for backward compatibility
    const nextState = !gridVisible;
    if (!(window as any).__hiddenLayersMap) {
      (window as any).__hiddenLayersMap = {};
    }
    (window as any).__hiddenLayersMap["grid-layer"] = !nextState;

    // Trigger canvas repaint
    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
    window.dispatchEvent(new CustomEvent("canvas-invalidate"));
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title="Toggle Canvas Snapping Reference Grid Plane"
      style={{
        padding: "6px 14px",
        cursor: "pointer",
        border: "1px solid #1E293B",
        borderRadius: "8px",
        backgroundColor: gridVisible ? "rgba(0, 210, 255, 0.15)" : "rgba(30, 41, 59, 0.4)",
        color: gridVisible ? "#00D2FF" : "#64748B",
        fontSize: "11px",
        fontFamily: "monospace",
        fontWeight: "bold",
        transition: "all 0.15s ease",
        outline: "none",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: gridVisible ? "0 0 10px rgba(0, 210, 255, 0.1)" : "none",
      }}
      className="hover:bg-slate-700/40"
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: gridVisible ? "#00D2FF" : "#64748B",
          boxShadow: gridVisible ? "0 0 6px #00D2FF" : "none",
        }}
      />
      GRID {gridVisible ? "ON" : "OFF"}
    </button>
  );
};

export default GridButton;