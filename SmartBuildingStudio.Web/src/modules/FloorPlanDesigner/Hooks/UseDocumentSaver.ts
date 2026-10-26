// src/modules/FloorPlanDesigner/Hooks/UseDocumentSaver.ts
// ✅ PascalCase hook name as requested

import { useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { selectDocument } from "@/modules/FloorPlanDesigner/Store/FloorPlanSelectors";
import { clearDirty } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

export const UseDocumentSaver = () => {
  const dispatch = useAppDispatch();
  const document = useAppSelector(selectDocument);
  const isDirty = useAppSelector((state) => state.floorPlan?.isDirty);

  const saveDocument = useCallback(async (docToSave?: any) => {
    // ✅ Always read the absolute latest state from Redux, not from closure.
    const state = (window as any).__store?.getState?.() || (await import("@/Application/ConfigureStore").then(m => m.store)).getState();
    const currentDoc = docToSave || state.floorPlan?.document;

    if (!currentDoc || !currentDoc.id) {
      console.warn("[UseDocumentSaver] No document ID to save.");
      return false;
    }

    try {
      const response = await fetch(`/api/documents/${currentDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentDoc.id,
          name: currentDoc.name,
          walls: currentDoc.walls || [],
          rooms: currentDoc.rooms || [],
          doors: currentDoc.doors || [],
          windows: currentDoc.windows || [],
          importedDrawings: currentDoc.importedDrawings || [],
          // Add any other fields your backend expects
        }),
      });

      if (!response.ok) throw new Error(`Save failed: ${response.status}`);
      
      // ✅ Clear the dirty flag on success
      dispatch(clearDirty());
      console.log("[UseDocumentSaver] Document saved successfully.");
      return true;
    } catch (error) {
      console.error("[UseDocumentSaver] Save error:", error);
      return false;
    }
  }, [dispatch]);

  return { saveDocument, document, isDirty };
};