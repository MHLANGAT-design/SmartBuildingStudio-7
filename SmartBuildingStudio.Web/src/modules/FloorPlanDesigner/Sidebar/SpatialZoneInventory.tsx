// SpatialZoneInventory.tsx
// COMPLETE FILE - Fixed selection highlighting

import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { setSelection } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

interface SpatialZoneInventoryProps {
  onSelect?: (room: any) => void;
  selectedRoomId?: string;
}

export function SpatialZoneInventory({ onSelect, selectedRoomId: externalSelectedId }: SpatialZoneInventoryProps) {
  const dispatch = useAppDispatch();
  const floorPlanState = useAppSelector((state: any) => state.floorPlan || {});
  const documentState = floorPlanState.document || {};
  const reduxRooms = documentState.rooms || [];
  
  const globalDoc = (window as any).__floorPlanActiveDocumentInstance;
  const globalRooms = globalDoc?.rooms || [];
  
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(externalSelectedId || null);
  
  // Use rooms from Redux or global
  const allRooms = reduxRooms.length > 0 ? reduxRooms : globalRooms;

  // Calculate area from points (Shoelace formula)
  const calculateArea = (points: {x: number, y: number}[]): number => {
    if (!points || points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2 / 1000000; // Convert to m²
  };

  const handleRoomSelect = (room: any) => {
    setSelectedRoomId(room.id);
    
    // ✅ FIX 1: Dispatch to Redux
    dispatch(setSelection(room));
    
    // ✅ FIX 2: Dispatch selection event for canvas
    window.dispatchEvent(new CustomEvent("sbs:selection-changed", {
      detail: {
        type: 'room',
        id: room.id,
        data: room
      }
    }));
    
    // ✅ FIX 3: Also set global selection
    (window as any).__currentSelection = {
      type: 'room',
      id: room.id,
      data: room
    };
    
    // ✅ FIX 4: Trigger canvas update
    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
    window.dispatchEvent(new CustomEvent("canvas-invalidate"));
    
    console.log('[RoomExplorer] ✅ Selected room:', room.name || room.id);
    
    if (onSelect) {
      onSelect(room);
    }
  };

  // Update if external selection changes
  useEffect(() => {
    if (externalSelectedId) {
      setSelectedRoomId(externalSelectedId);
    }
  }, [externalSelectedId]);

  return (
    <div style={{ fontFamily: "monospace", padding: "4px", width: "100%", boxSizing: "border-box" }}>
      {allRooms.length === 0 ? (
        <div style={{ 
          color: "#475569", 
          fontSize: "10px", 
          textAlign: "center", 
          padding: "40px 0" 
        }}>
          No rooms drawn yet.<br/>
          Use the Room Tool to create zones.
        </div>
      ) : (
        allRooms.map((room: any, index: number) => {
          const points = room.points || room.vertices || [];
          const area = calculateArea(points);
          const isSelected = selectedRoomId === room.id;
          
          return (
            <div
              key={room.id || index}
              onClick={() => handleRoomSelect(room)}
              style={{
                padding: "10px 12px",
                marginBottom: "6px",
                borderRadius: "6px",
                cursor: "pointer",
                backgroundColor: isSelected ? "rgba(5, 255, 196, 0.15)" : "transparent",
                border: isSelected ? "1px solid #05FFC4" : "1px solid transparent",
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "rgba(5, 255, 196, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(5, 255, 196, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ 
                  color: isSelected ? "#05FFC4" : "#E2E8F0", 
                  fontSize: "11px",
                  fontWeight: isSelected ? "bold" : "normal"
                }}>
                  {room.name || `Zone ${index + 1}`}
                </span>
                <span style={{ 
                  color: isSelected ? "#05FFC4" : "#94A3B8", 
                  fontSize: "10px"
                }}>
                  {area > 0 ? `${area.toFixed(2)} m²` : "0.00 m²"}
                </span>
              </div>
              
              <div style={{ 
                display: "flex", 
                gap: "12px", 
                marginTop: "4px",
                fontSize: "9px",
                color: "#64748B"
              }}>
                <span>Lux: {room.targetLux || 500}</span>
                <span>Group: G{room.primaryGroup || 1}</span>
                <span>Points: {points?.length || 0}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default SpatialZoneInventory;