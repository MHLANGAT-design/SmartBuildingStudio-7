// RoomExplorer.tsx
// COMPLETE FILE - Clean selection handler

import React from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { setSelection } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { SpatialZoneInventory } from "@/modules/FloorPlanDesigner/Sidebar/SpatialZoneInventory";

interface RoomExplorerProps {
  toolManager?: any;
  toolContext?: any;
}

export default function RoomExplorer({ toolManager, toolContext }: RoomExplorerProps) {
  const dispatch = useAppDispatch();
  const floorPlanState = useAppSelector((state: any) => state.floorPlan || {});
  const selection = floorPlanState.selection;

  const handleRoomSelect = (room: any) => {
    // ✅ Dispatch to Redux
    dispatch(setSelection(room));
    
    // ✅ Dispatch selection event for canvas
    window.dispatchEvent(new CustomEvent("sbs:selection-changed", {
      detail: {
        type: 'room',
        id: room.id,
        data: room
      }
    }));
    
    // ✅ Set global selection
    (window as any).__currentSelection = {
      type: 'room',
      id: room.id,
      data: room
    };
    
    // ✅ Trigger canvas update
    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
    window.dispatchEvent(new CustomEvent("canvas-invalidate"));
    
    console.log('[RoomExplorer] ✅ Selected room:', room.name || room.id);
  };

  return (
    <div style={{ width: "100%", height: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
        paddingBottom: "8px",
        borderBottom: "1px solid #1E293B"
      }}>
        <div>
          <span style={{ color: "#E2E8F0", fontSize: "12px", fontWeight: "bold", fontFamily: "monospace" }}>
            🚪 Room Explorer
          </span>
          <p style={{ color: "#64748B", fontSize: "9px", margin: "2px 0 0 0", fontFamily: "monospace" }}>
            Click a room to highlight on canvas
          </p>
        </div>
      </div>

      <SpatialZoneInventory 
        onSelect={handleRoomSelect}
        selectedRoomId={selection?.id}
      />
    </div>
  );
}