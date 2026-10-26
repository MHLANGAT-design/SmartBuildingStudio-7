// src/modules/FloorPlanDesigner/Hooks/useFloorPlanCanvasFetch.ts
import { transformDbSchemaToCanvasSchema } from '@/modules/FloorPlanDesigner/Utils/DatabaseToCanvasTransformer';

export function useFloorPlanCanvasFetch(effectiveDocumentState: any, currentDocument: any) {
  const targetPayload = effectiveDocumentState || currentDocument;
  
  // Convert walls, doors, and windows into structured lines
  const transformedPlan = transformDbSchemaToCanvasSchema(targetPayload);

  return {
    canvasPlan: transformedPlan
  };
}
