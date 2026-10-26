// src/modules/DaliDesigner/Toolbar/groups/NetworkGroup.tsx
//
// LEVEL 1 LOCK ENFORCEMENT: Save / SaveAs / Reset disabled in
// read-only mode. Export stays enabled (reads data).

import React from "react";
import { SaveButton } from "@/modules/DaliDesigner/Toolbar/buttons/SaveButton";
import { SaveAsButton } from "@/modules/DaliDesigner/Toolbar/buttons/SaveAsButton";
import { ExportButton } from "@/modules/DaliDesigner/Toolbar/buttons/ExportButton";
import { ResetNetworkButton } from "@/modules/DaliDesigner/Toolbar/buttons/ResetNetworkButton";
import { useDaliLockState } from "@/modules/DaliDesigner/hooks/useDaliLockState";

export function NetworkGroup() {
  const { isReadOnly, lockedByUsername } = useDaliLockState();

  return (
    <div className="tb-group tb-network">
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          opacity: isReadOnly ? 0.45 : 1,
          cursor: isReadOnly ? "not-allowed" : "auto",
          transition: "opacity 0.15s",
        }}
        title={
          isReadOnly
            ? `Read-only: document is locked by ${lockedByUsername || "another user"}`
            : undefined
        }
        onClickCapture={(e) => {
          if (isReadOnly) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <SaveButton />
        <SaveAsButton />
        <ResetNetworkButton />
      </div>
      <ExportButton />
    </div>
  );
}