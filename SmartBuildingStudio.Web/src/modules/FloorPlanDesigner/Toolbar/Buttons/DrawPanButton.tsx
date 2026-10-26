import React, { useState, useEffect } from "react";
import { ToolManager } from "@/modules/FloorPlanDesigner/Tools/ToolManager";
import { PanTool } from "@/modules/FloorPlanDesigner/Tools/PanTool";

export interface DrawPanButtonProps {
  toolManager: ToolManager;
}

export const DrawPanButton: React.FC<DrawPanButtonProps> = ({ toolManager }) => {
  const targetPanToolId = PanTool.ID || "pan";

  const [active, setActive] = useState(() => {
    return toolManager && typeof toolManager.getActiveTool === "function" 
      ? String((toolManager as any).getActiveTool()?.id).toLowerCase() === String(targetPanToolId).toLowerCase()
      : false;
  });

  useEffect(() => {
    if (!toolManager) return;
    
    const handleGlobalToolNotification = () => {
      const current = (toolManager as any).getActiveTool?.() || (toolManager as any)._activeTool;
      const currentId = current?.id || current?.constructor?.ID || current?.constructor?.id || "";
      setActive(String(currentId).toLowerCase() === String(targetPanToolId).toLowerCase());
    };

    window.dispatchEvent(new CustomEvent("canvas-invalidate"));
    window.addEventListener("sbs:tool-change", handleGlobalToolNotification);
    
    return () => {
      window.removeEventListener("sbs:tool-change", handleGlobalToolNotification);
    };
  }, [toolManager, targetPanToolId]);

  const handleActivateTool = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!toolManager) return;

    try {
      console.log(`[Toolbar Interaction Engine] Activating viewport pan instrument...`);
      toolManager.activate(targetPanToolId);
      window.dispatchEvent(new CustomEvent("sbs:tool-change", { detail: { id: targetPanToolId } }));
    } catch (err) {
      console.error("Failed to execute pan tool activate:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleActivateTool}
      title="Click and drag canvas grid layout panes (✋)"
      style={{
        padding: "6px 14px",
        cursor: "pointer",
        border: "1px solid #1E293B",
        borderRadius: "8px",
        backgroundColor: active ? "rgba(168, 85, 247, 0.15)" : "rgba(30, 41, 59, 0.6)",
        color: active ? "#A855F7" : "#E2E8F0", // Purple navigation accent theme
        fontSize: "11px",
        fontFamily: "monospace",
        fontWeight: "bold",
        transition: "all 0.15s ease",
        outline: "none",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: active ? "0 0 10px rgba(168, 85, 247, 0.1)" : "0 2px 8px rgba(0,0,0,0.2)"
      }}
      className="hover:bg-slate-700/60"
    >
      <span style={{ color: active ? "#A855F7" : "#64748B" }}>✋</span> Pan View
    </button>
  );
};

export default DrawPanButton;
