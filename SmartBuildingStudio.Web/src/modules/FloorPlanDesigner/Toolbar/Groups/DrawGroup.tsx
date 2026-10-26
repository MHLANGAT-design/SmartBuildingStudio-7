// src/modules/FloorPlanDesigner/Toolbar/Groups/DrawGroup.tsx
//
// LEVEL 1 READ-ONLY: when isReadOnly is true, all structural drawing
// tools (wall/room/door/window) are disabled. The Select tool remains
// enabled because selection is a viewing operation.

import React from "react";
import { useAppDispatch } from "@/Application/ConfigureStore";
import { setActiveTool } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { ToolManager } from "@/modules/FloorPlanDesigner/Tools/ToolManager";
import { DrawWallButton } from "@/modules/FloorPlanDesigner/Toolbar/Buttons/DrawWallButton";
import { DrawRoomButton } from "@/modules/FloorPlanDesigner/Toolbar/Buttons/DrawRoomButton";
import { DrawDoorButton } from "@/modules/FloorPlanDesigner/Toolbar/Buttons/DrawDoorButton";
import { DrawWindowButton } from "@/modules/FloorPlanDesigner/Toolbar/Buttons/DrawWindowButton";

export interface DrawGroupProps {
  toolManager: ToolManager;
  isReadOnly?: boolean;
}

export const DrawGroup: React.FC<DrawGroupProps> = ({ toolManager, isReadOnly = false }) => {
  const dispatch = useAppDispatch();

  const isSelectActive = toolManager.getActiveTool()?.getId() === "select";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem",
      }}
    >
      {/* Pointer / window select button — enabled in read-only (viewing) */}
      <button
        type="button"
        onClick={() => {
          try {
            toolManager.activate("select");
            dispatch(setActiveTool("select"));
          } catch (err) {
            console.warn("Failed to switch layout to selection pointer:", err);
          }
        }}
        style={{
          padding: "6px 12px",
          backgroundColor: isSelectActive ? "rgba(5, 255, 196, 0.06)" : "#090D16",
          border: `1px solid ${isSelectActive ? "#05FFC4" : "#1E293B"}`,
          color: isSelectActive ? "#05FFC4" : "#94A3B8",
          borderRadius: "6px",
          fontFamily: "monospace",
          fontSize: "11px",
          fontWeight: "bold",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          transition: "all 0.15s",
          outline: "none",
        }}
        title="Select Tool (Supports Point & Window Drag Selection)"
      >
        <span style={{ fontSize: "12px" }}>⬈</span> SELECT
      </button>

      {/* Structural drawing tools — wrapped in a disabled container
          when read-only. We disable the container's pointerEvents so
          the child buttons inherit non-interactivity, plus we set
          opacity + title to make it visually clear why. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          opacity: isReadOnly ? 0.4 : 1,
          pointerEvents: isReadOnly ? "none" : "auto",
          transition: "opacity 0.15s",
        }}
        title={isReadOnly ? "Read-only: document is locked by another user" : undefined}
      >
        <DrawWallButton toolManager={toolManager} />
        <DrawRoomButton toolManager={toolManager} />
        <DrawDoorButton toolManager={toolManager} />
        <DrawWindowButton toolManager={toolManager} />
      </div>
    </div>
  );
};

export default DrawGroup;