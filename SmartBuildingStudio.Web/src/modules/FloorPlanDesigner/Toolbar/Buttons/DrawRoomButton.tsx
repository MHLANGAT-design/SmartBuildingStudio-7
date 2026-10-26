import React, { useState, useEffect } from "react";
import { useAppDispatch } from "@/Application/ConfigureStore";
import { setActiveTool } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { ToolManager } from "@/modules/FloorPlanDesigner/Tools/ToolManager";
import { RoomTool } from "@/modules/FloorPlanDesigner/Tools/RoomTool";

export interface DrawRoomButtonProps {
  toolManager: ToolManager;
}

export const DrawRoomButton: React.FC<DrawRoomButtonProps> = ({ toolManager }) => {
  const dispatch = useAppDispatch();

  const targetRoomToolId = (RoomTool as any).ID || (RoomTool as any).id || "room";

  const [active, setActive] = useState(() => {
    return toolManager && typeof toolManager.getActiveTool === "function"
      ? String((toolManager as any).getActiveTool()?.id).toLowerCase() ===
          String(targetRoomToolId).toLowerCase()
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
        String(currentId).toLowerCase() === String(targetRoomToolId).toLowerCase()
      );
    };

    window.addEventListener("sbs:tool-change", handleGlobalToolNotification);

    return () => {
      window.removeEventListener("sbs:tool-change", handleGlobalToolNotification);
    };
  }, [toolManager, targetRoomToolId]);

  const handleActivateTool = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!toolManager || !targetRoomToolId) return;

    try {
      console.log(
        `[Toolbar Interaction Engine] Swapping cursor mode straight to: ${targetRoomToolId}`
      );

      if (typeof toolManager.activate === "function") {
        toolManager.activate(targetRoomToolId);
      } else if (typeof toolManager.setActiveTool === "function") {
        toolManager.setActiveTool(targetRoomToolId);
      }

      // Update Redux so FloorPlanDesigner's `activeTool` selector picks up
      // the new tool and passes it to FloorPlanCanvas via props.
      dispatch(setActiveTool(targetRoomToolId as any));

      // Keep the window event for any legacy listeners.
      window.dispatchEvent(
        new CustomEvent("sbs:tool-change", { detail: { id: targetRoomToolId } })
      );
    } catch (err) {
      console.error("Failed to execute room tool activate sequence:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleActivateTool}
      title="Draft Multi-Point Boundary Vector Room Areas (🟩)"
      style={{
        padding: "6px 14px",
        cursor: "pointer",
        border: "1px solid #1E293B",
        borderRadius: "8px",
        backgroundColor: active ? "rgba(5, 255, 196, 0.15)" : "rgba(30, 41, 59, 0.6)",
        color: active ? "#05FFC4" : "#E2E8F0",
        fontSize: "11px",
        fontFamily: "monospace",
        fontWeight: "bold",
        transition: "all 0.15s ease",
        outline: "none",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: active
          ? "0 0 10px rgba(5, 255, 196, 0.1)"
          : "0 2px 8px rgba(0,0,0,0.2)",
      }}
      className="hover:bg-slate-700/60"
    >
      <span style={{ color: active ? "#05FFC4" : "#64748B" }}>🟩</span> Room
    </button>
  );
};

export default DrawRoomButton;