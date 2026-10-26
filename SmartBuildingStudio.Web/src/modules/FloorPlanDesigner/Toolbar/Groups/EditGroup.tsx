// src/modules/FloorPlanDesigner/Toolbar/Groups/EditGroup.tsx
//
// LEVEL 1 READ-ONLY: undo/redo are edits. Disabled when locked.

import React from "react";
import { DocumentManager } from "@/modules/FloorPlanDesigner/Document/DocumentManager";
import { UndoButton } from "@/modules/FloorPlanDesigner/Toolbar/Buttons/UndoButton";
import { RedoButton } from "@/modules/FloorPlanDesigner/Toolbar/Buttons/RedoButton";

export interface EditGroupProps {
  documentManager: DocumentManager;
  isReadOnly?: boolean;
}

export const EditGroup: React.FC<EditGroupProps> = ({ documentManager, isReadOnly = false }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem",
        opacity: isReadOnly ? 0.4 : 1,
        pointerEvents: isReadOnly ? "none" : "auto",
        transition: "opacity 0.15s",
      }}
      title={isReadOnly ? "Read-only: document is locked by another user" : undefined}
    >
      <UndoButton documentManager={documentManager} />
      <RedoButton documentManager={documentManager} />
    </div>
  );
};

export default EditGroup;