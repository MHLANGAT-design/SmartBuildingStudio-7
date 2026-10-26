// src/modules/FloorPlanDesigner/Toolbar/Groups/ValidateGroup.tsx
//
// LEVEL 1 READ-ONLY: validation reads the document but doesn't modify
// it, so it stays enabled in read-only mode.

import React from "react";
import { FloorPlanApi } from "@/modules/FloorPlanDesigner/Services/FloorPlanApi";
import { ValidateDrawingButton } from "@/modules/FloorPlanDesigner/Toolbar/Buttons/ValidateDrawingButton";

export interface ValidateGroupProps {
  api: FloorPlanApi;
  isReadOnly?: boolean;   // accepted for interface parity; not used
}

export const ValidateGroup: React.FC<ValidateGroupProps> = ({ api }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem",
      }}
    >
      <ValidateDrawingButton api={api} />
    </div>
  );
};

export default ValidateGroup;