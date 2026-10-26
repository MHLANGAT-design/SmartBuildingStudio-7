import React, { useState, useEffect } from "react";
import { ToolManager } from "@/modules/FloorPlanDesigner/Tools/ToolManager";

interface ActiveToolStatusWidgetProps {
  toolManager: ToolManager;
}

export const ActiveToolStatusWidget: React.FC<ActiveToolStatusWidgetProps> = ({ toolManager }) => {
  const [activeId, setActiveId] = useState("select");

  useEffect(() => {
    // 🚀 FIXED: Retain local interval polling as a legacy baseline, adding strict case normalization
    if (!toolManager) return;
    const interval = setInterval(() => {
      const currentTool = (toolManager as any).getActiveTool?.() || (toolManager as any)._activeTool || (toolManager as any).activeTool;
      if (currentTool) {
        const id = currentTool.id || currentTool.Id || currentTool.constructor?.ID || currentTool.constructor?.id || "select";
        setActiveId(String(id).toLowerCase().replace("tool", "")); // Standardize strings ("WallTool" -> "wall")
      }
    }, 200);
    return () => clearInterval(interval);
  }, [toolManager]);

  // 🚀 FIXED: Embedded an autonomous Global Window Event Interceptor!
  // This allows the HUD to capture instant tool swaps fired directly from your toolbar buttons
  useEffect(() => {
    const handleGlobalToolSwapEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail) return;
      
      const targetToolId = customEvent.detail.id || customEvent.detail.toolId || "select";
      setActiveId(String(targetToolId).toLowerCase().replace("tool", ""));
    };

    window.addEventListener("sbs:tool-change", handleGlobalToolSwapEvent);
    return () => {
      window.removeEventListener("sbs:tool-change", handleGlobalToolSwapEvent);
    };
  }, []);

  const toolProfiles: Record<string, { label: string; glyph: string; color: string }> = {
    select: { label: "Object Transform // Selection Mode", glyph: "⬈", color: "#00D2FF" },
    wall: { label: "Structural Layout // Continuous Vector", glyph: "🧱", color: "#FFB800" },
    door: { label: "Aperture Mounting // Door Fixture", glyph: "🚪", color: "#05FFC4" },
    window: { label: "Aperture Mounting // Window Glazing", glyph: "🪟", color: "#F43F5E" },
    pan: { label: "Viewport Translation // Panning", glyph: "✋", color: "#A855F7" },
    zoom: { label: "Scale Modification // Zooming", glyph: "🔍", color: "#3B82F6" }
  };

  const current = toolProfiles[activeId] || { label: "Interactive Multi-Tool Engaged", glyph: "🛠️", color: "#FFF" };
  return (
    <div style={{ background: "linear-gradient(90deg, #0F172A, #090D16)", border: "1px solid #1E293B", borderRadius: "12px", padding: "12px 18px", display: "flex", alignItems: "center", justifyBetween: "space-between", gap: "16px", boxSizing: "border-box", width: "100%", userSelect: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(30,41,59,0.5)", border: `1px solid ${current.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: current.color, boxShadow: `0 0 10px ${current.color}22`, transition: "all 0.15s ease-in-out" }}>
          {current.glyph}
        </div>
        <div>
          <div style={{ fontSize: "9px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Workbench Tool</div>
          <div style={{ fontSize: "12px", fontWeight: "bold", color: "#FFF", marginTop: "2px", fontFamily: "sans-serif" }}>{current.label}</div>
        </div>
      </div>
      <span style={{ fontSize: "9px", fontFamily: "monospace", color: current.color, background: `${current.color}11`, border: `1px solid ${current.color}33`, padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", fontWeight: "bold", transition: "all 0.15s ease-in-out" }}>
        {activeId} HUD // OK
      </span>
    </div>
  );
};

export default ActiveToolStatusWidget;
