import React, { useState, useEffect } from "react";
import { useAppDispatch } from "@/Application/ConfigureStore";
import { setActiveTool } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { ToolManager } from "@/modules/FloorPlanDesigner/Tools/ToolManager";
import { WallTool } from "@/modules/FloorPlanDesigner/Tools/WallTool";

export interface DrawWallButtonProps {
  toolManager: ToolManager;
}

export const DrawWallButton: React.FC<DrawWallButtonProps> = ({ toolManager }) => {
  const dispatch = useAppDispatch();

  const [active, setActive] = useState(() => {
    return toolManager && typeof toolManager.getActiveTool === "function"
      ? (toolManager as any).getActiveTool()?.id === WallTool.ID
      : false;
  });

  useEffect(() => {
    if (!toolManager) return;

    const handleGlobalToolNotification = () => {
      const current =
        (toolManager as any).getActiveTool?.() || (toolManager as any)._activeTool;
      const currentId =
        current?.id || current?.constructor?.ID || current?.constructor?.id;
      setActive(String(currentId).toLowerCase() === WallTool.ID);
    };

    window.addEventListener("sbs:tool-change", handleGlobalToolNotification);

    return () => {
      window.removeEventListener("sbs:tool-change", handleGlobalToolNotification);
    };
  }, [toolManager]);

  const handleActivateTool = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!toolManager || !WallTool.ID) return;

    try {
      console.log(
        `[Toolbar Interaction Engine] Swapping cursor mode straight to: ${WallTool.ID}`
      );
      toolManager.activate(WallTool.ID);
      dispatch(setActiveTool(WallTool.ID as any));
      window.dispatchEvent(
        new CustomEvent("sbs:tool-change", { detail: { id: WallTool.ID } })
      );
    } catch (err) {
      console.error("Failed to execute tool activate sequence:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleActivateTool}
      title="Draft Continuous Structural Insulation Boundaries (🧱)"
      style={{
        padding: "6px 14px",
        cursor: "pointer",
        border: "1px solid #1E293B",
        borderRadius: "8px",
        backgroundColor: active ? "rgba(255, 184, 0, 0.15)" : "rgba(30, 41, 59, 0.6)",
        color: active ? "#FFB800" : "#E2E8F0",
        fontSize: "11px",
        fontFamily: "monospace",
        fontWeight: "bold",
        transition: "all 0.15s ease",
        outline: "none",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: active
          ? "0 0 10px rgba(255, 184, 0, 0.1)"
          : "0 2px 8px rgba(0,0,0,0.2)",
      }}
      className="hover:bg-slate-700/60"
    >
      <span style={{ color: active ? "#FFB800" : "#64748B" }}>🧱</span> Wall
    </button>
  );
};

export default DrawWallButton;