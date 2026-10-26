// UseFloorPlanDebugger.ts
// Diagnostic hook — isolated from DrawingCanvas.tsx
import { useEffect } from "react";
import { useAppSelector } from "@/Application/ConfigureStore";
import { selectDocument } from "@/modules/FloorPlanDesigner/Store/FloorPlanSelectors";

export function UseFloorPlanDebugger(): void {
  const activeDocState = useAppSelector(selectDocument);

  useEffect(() => {
    // 1. Resolve current router path state variables
    const queryParams = new URLSearchParams(window.location.search);
    const activeMode = queryParams.get("mode") || (window as any).__designerMode || "floorplans";
    const documentId = queryParams.get("documentId") || (window as any).__activeDocumentId || "Unassigned";

    // 2. Extract live vector counts
    const wallsCount = activeDocState?.walls?.length || 0;
    const doorsCount = activeDocState?.doors?.length || 0;
    const windowsCount = activeDocState?.windows?.length || 0;
    const roomsCount = activeDocState?.rooms?.length || 0;
    const drawingsCount = activeDocState?.importedDrawings?.length || 0;

    // 3. Extract floating origin shift matrix anchors
    const shiftVector = (window as any).__localOriginShift || { x: 0, y: 0 };

    // 🚀 THE ISOLATED CONSOLE TELEMETRY MATRIX
    console.group(`%c[CAD Ingestion HUD Engine] // Session Tracking Tracker`, "color: #A855F7; font-weight: bold; font-family: monospace;");
    console.log(`%cActive Layout ID : %c${documentId}`, "color: #64748B;", "color: #38BDF8; font-weight: bold;");
    console.log(`%cOperational Mode : %c${activeMode.toUpperCase()}`, "color: #64748B;", "color: #F59E0B; font-weight: bold;");

    console.table({
      "Walls Array Cache": { Count: wallsCount, Status: wallsCount > 0 ? "HYDRATED ✓" : "EMPTY ∅" },
      "Doors Opening Pool": { Count: doorsCount, Status: doorsCount > 0 ? "HYDRATED ✓" : "EMPTY ∅" },
      "Windows Glazing Pool": { Count: windowsCount, Status: windowsCount > 0 ? "HYDRATED ✓" : "EMPTY ∅" },
      "Defined Space Rooms": { Count: roomsCount, Status: roomsCount > 0 ? "HYDRATED ✓" : "EMPTY ∅" },
      "DWG Blueprint Segments": { Count: drawingsCount, Status: drawingsCount > 0 ? "HYDRATED ✓" : "EMPTY ∅" },
    });

    console.log(`%cActive Matrix Shift: X = ${shiftVector.x.toFixed(2)} | Y = ${shiftVector.y.toFixed(2)}`, "color: #05FFC4; font-weight: bold; background-color: rgba(5,255,196,0.05); padding: 4px; border-radius: 4px;");
    console.groupEnd();
  }, [activeDocState]);
}

export default UseFloorPlanDebugger;