import React, { useState, useEffect } from "react";
import { useAppDispatch } from "@/Application/ConfigureStore";
import { setActiveTool } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { ToolManager } from "@/modules/FloorPlanDesigner/Tools/ToolManager";
import { DoorTool } from "@/modules/FloorPlanDesigner/Tools/DoorTool";

export interface DrawDoorButtonProps {
  toolManager: ToolManager;
}

export const DrawDoorButton: React.FC<DrawDoorButtonProps> = ({ toolManager }) => {
  const dispatch = useAppDispatch();

  const targetDoorToolId = DoorTool.ID || "door";

  const [active, setActive] = useState(() => {
    return toolManager && typeof toolManager.getActiveTool === "function"
      ? String((toolManager as any).getActiveTool()?.id).toLowerCase() ===
          String(targetDoorToolId).toLowerCase()
      : false;
  });

  useEffect(() => {
    if (!toolManager) return;

    const handleGlobalToolNotification = () => {
      const current =
        (toolManager as any).getActiveTool?.() || (toolManager as any)._activeTool;
      const currentId =
        current?.id || current?.constructor?.ID || current?.constructor?.id || "";
      setActive(
        String(currentId).toLowerCase() === String(targetDoorToolId).toLowerCase()
      );
    };

    window.addEventListener("sbs:tool-change", handleGlobalToolNotification);

    return () => {
      window.removeEventListener("sbs:tool-change", handleGlobalToolNotification);
    };
  }, [toolManager, targetDoorToolId]);

  const handleActivateTool = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!toolManager || !targetDoorToolId) return;

    try {
      console.log(
        `[Toolbar Interaction Engine] Swapping cursor mode straight to: ${targetDoorToolId}`
      );
      if (typeof toolManager.activate === "function") {
        toolManager.activate(targetDoorToolId);
      } else if (typeof toolManager.setActiveTool === "function") {
        toolManager.setActiveTool(targetDoorToolId);
      }

      dispatch(setActiveTool(targetDoorToolId as any));

      window.dispatchEvent(
        new CustomEvent("sbs:tool-change", { detail: { id: targetDoorToolId } })
      );
    } catch (err) {
      console.error("Failed to execute door tool activate sequence:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleActivateTool}
      title="Insert Aperture Door Openings into Structural Elements (🚪)"
      style={{
        padding: "6px 14px",
        cursor: "pointer",
        border: "1px solid #1E293B",
        borderRadius: "8px",
        backgroundColor: active ? "rgba(234, 179, 8, 0.15)" : "rgba(30, 41, 59, 0.6)",
        color: active ? "#EAB308" : "#E2E8F0",
        fontSize: "11px",
        fontFamily: "monospace",
        fontWeight: "bold",
        transition: "all 0.15s ease",
        outline: "none",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: active
          ? "0 0 10px rgba(234, 179, 8, 0.1)"
          : "0 2px 8px rgba(0,0,0,0.2)",
      }}
      className="hover:bg-slate-700/60"
    >
      <span style={{ color: active ? "#EAB308" : "#64748B" }}>🚪</span> Door
    </button>
  );
};

export default DrawDoorButton;