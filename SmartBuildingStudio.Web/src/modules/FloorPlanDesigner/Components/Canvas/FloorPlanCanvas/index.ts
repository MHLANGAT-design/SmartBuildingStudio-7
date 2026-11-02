// src/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/index.ts
//
// Re-export shim. Existing imports of
//   '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas'
// keep resolving to the component even though the real file is now
// inside this folder.

export { FloorPlanCanvas, FloorPlanCanvas as default } from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/FloorPlanCanvas';
export type { FloorPlanCanvasProps } from '@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/types';