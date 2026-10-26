// src/modules/DaliDesigner/Toolbar/groups/GroupingGroup.tsx
//
// LEVEL 1 LOCK ENFORCEMENT: assigning groups is a write operation.

import React from "react";
import { AssignGroupButton } from "@/modules/DaliDesigner/Toolbar/buttons/AssignGroupButton";
import { useDaliLockState } from "@/modules/DaliDesigner/hooks/useDaliLockState";

export function GroupingGroup() {
  const { isReadOnly, lockedByUsername } = useDaliLockState();

  return (
    <div
      className="tb-group tb-grouping"
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
      <AssignGroupButton />
    </div>
  );
}