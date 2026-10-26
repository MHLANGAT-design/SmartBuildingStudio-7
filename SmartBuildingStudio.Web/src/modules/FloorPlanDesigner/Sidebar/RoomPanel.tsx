// RoomPanel.tsx
// COMPLETE FILE - Parent component that uses SpatialZoneInventory

import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { SpatialZoneInventory } from "@/modules/FloorPlanDesigner/Sidebar/SpatialZoneInventory";
import { setSelection } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

export function RoomPanel() {
  const dispatch = useAppDispatch();
  const floorPlanState = useAppSelector((state: any) => state.floorPlan || {});
  const selection = floorPlanState.selection;
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const handleRoomSelect = (room: any) => {
    setSelectedRoomId(room.id);
    // ✅ Highlight the room on canvas
    dispatch(setSelection(room));
    // ✅ Also dispatch selection event for canvas
    window.dispatchEvent(new CustomEvent("sbs:selection-changed", {
      detail: {
        type: 'room',
        id: room.id,
        data: room
      }
    }));
  };

  // Sync with external selection changes
  useEffect(() => {
    if (selection?.type === 'Room' || selection?.type === 'room') {
      setSelectedRoomId(selection.id);
    }
  }, [selection]);

  return (
    <div style={{ 
      padding: "8px", 
      width: "100%", 
      boxSizing: "border-box",
      fontFamily: "monospace"
    }}>
      {/* Header with room count */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
        paddingBottom: "8px",
        borderBottom: "1px solid #1E293B"
      }}>
        <span style={{ color: "#E2E8F0", fontSize: "12px", fontWeight: "bold" }}>
          📐 Rooms
        </span>
        <span style={{ color: "#64748B", fontSize: "10px" }}>
          Click a room to highlight on canvas
        </span>
      </div>

      {/* ✅ Use the SpatialZoneInventory component */}
      <SpatialZoneInventory 
        onSelect={handleRoomSelect}
        selectedRoomId={selectedRoomId}
      />
    </div>
  );
}

export default RoomPanel;