// src/modules/DaliDesigner/Toolbar/groups/SceneGroup.tsx
//
// LEVEL 1 LOCK ENFORCEMENT: creating a scene is a write operation.
// Testing a scene (which sends commands to devices, not modifies the
// document) is arguably read-only, but to keep behaviour predictable
// we gate both — read-only mode should not issue device commands
// either. If you later want Test enabled in read-only, split it out.

import React from "react";
import { CreateSceneButton } from "@/modules/DaliDesigner/Toolbar/buttons/CreateSceneButton";
import { TestSceneButton } from "@/modules/DaliDesigner/Toolbar/buttons/TestSceneButton";
import { useDaliLockState } from "@/modules/DaliDesigner/hooks/useDaliLockState";

export function SceneGroup() {
  const { isReadOnly, lockedByUsername } = useDaliLockState();

  return (
    <div
      className="tb-group tb-scene"
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
      <CreateSceneButton />
      <TestSceneButton />
    </div>
  );
}