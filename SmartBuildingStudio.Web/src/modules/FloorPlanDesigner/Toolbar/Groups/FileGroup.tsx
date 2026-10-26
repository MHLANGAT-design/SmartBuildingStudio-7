// FileGroup.tsx in src/modules/FloorPlanDesigner/Toolbar/Groups
//
// LEVEL 1 READ-ONLY:
//   • Save — DISABLED (write to locked doc)
//   • Save As — enabled (creates new doc)
//   • Export — enabled (reads)
//   • Open Fixtures — enabled (navigation)
//
// Import Drawing button was removed — the sidebar's DrawingExplorer
// "Choose DXF File" is the single import entry point. It runs the same
// UseDxfImport pipeline and is gated on hasSavedGeometry so it won't
// overwrite an existing floor plan. The toolbar button had an
// intermittent failure on large DXFs (never confirmed, possibly a
// component-unmount race) and was redundant.

import React from "react";
import { useAppDispatch } from "@/Application/ConfigureStore";
import { FloorPlanApi } from "@/modules/FloorPlanDesigner/Services/FloorPlanApi";
import { saveDrawing } from "@/modules/FloorPlanDesigner/Store/FloorPlanThunks";
import { SaveButton } from "@/modules/FloorPlanDesigner/Toolbar/Buttons/SaveButton";
import { SaveAsButton } from "@/modules/FloorPlanDesigner/Toolbar/Buttons/SaveAsButton";
import { ExportButton } from "@/modules/FloorPlanDesigner/Toolbar/Buttons/ExportButton";
import { OpenFixturesButton } from "@/modules/FloorPlanDesigner/Toolbar/Buttons/OpenFixturesButton";

export interface FileGroupProps {
  api: FloorPlanApi;
  isReadOnly?: boolean;
}

export const FileGroup: React.FC<FileGroupProps> = ({ api, isReadOnly = false }) => {
  const dispatch = useAppDispatch();

  const handleReduxSaveAction = React.useCallback(async () => {
    try {
      await dispatch(saveDrawing() as any).unwrap();
    } catch (err: any) {
      console.error(`[FileGroup] Redux DB Save transaction failed: ${err.message}`);
    }
  }, [dispatch]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.25rem",
      }}
    >
      {/* Save — disabled in read-only mode */}
      <div
        style={{
          display: "inline-flex",
          opacity: isReadOnly ? 0.4 : 1,
          pointerEvents: isReadOnly ? "none" : "auto",
          transition: "opacity 0.15s",
        }}
        title={isReadOnly ? "Read-only: cannot save a document locked by another user" : undefined}
      >
        <SaveButton
          api={api}
          onClick={handleReduxSaveAction}
        />
      </div>

      <SaveAsButton api={api} />

      <OpenFixturesButton />

      <ExportButton api={api} />
    </div>
  );
};

export default FileGroup;