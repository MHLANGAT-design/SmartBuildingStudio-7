// src/modules/FloorPlanDesigner/Hooks/useFloorPlanCanvasImport.ts
export function useFloorPlanCanvasImport(effectiveDocumentState: any, currentDocument: any) {
  const rawImportPlan = effectiveDocumentState || currentDocument;

  return {
    canvasPlan: rawImportPlan
  };
}
