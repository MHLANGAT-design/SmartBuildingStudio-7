// src/modules/FloorPlanDesigner/Hooks/UseDesignerMode.ts
//
// Reads the current designer mode from the URL. Provides two derived
// booleans that gate UI affordances:
//
//   isImportTrack  → mode=floorplans & action=import-dwg
//                    (user explicitly chose "Import Fresh DWG" in the
//                    ProjectExplorer modal; they want to import a file)
//
//   isFloorPlanTrack → mode=floorplans (default track, no import action)
//                    (user opened an existing document that already has
//                    floor plan geometry in the database)
//
// Consumers:
//   - OpenFixturesButton: disabled while isImportTrack is true AND the
//     document is still dirty (i.e., the import hasn't been saved yet).
//   - DrawingExplorer (Choose DXF): disabled when isFloorPlanTrack, so
//     the user can't import a DXF on top of an existing DB floor plan.

import { useSearchParams } from "react-router-dom";

export interface DesignerMode {
  mode: string;
  action: string | null;
  isImportTrack: boolean;
  isFloorPlanTrack: boolean;
}

export function UseDesignerMode(): DesignerMode {
  const [searchParams] = useSearchParams();

  const mode = (searchParams.get("mode") || "floorplans").toLowerCase();
  const action = searchParams.get("action"); // 'import-dwg' or null

  const isImportTrack = mode === "floorplans" && action === "import-dwg";
  const isFloorPlanTrack = mode === "floorplans" && !isImportTrack;

  return { mode, action, isImportTrack, isFloorPlanTrack };
}