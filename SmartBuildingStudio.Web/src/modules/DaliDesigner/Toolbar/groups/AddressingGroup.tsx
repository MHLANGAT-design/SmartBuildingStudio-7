// src/modules/DaliDesigner/Toolbar/groups/AddressingGroup.tsx
//
// LEVEL 1 LOCK ENFORCEMENT: automatic / manual addressing both write
// to devices. Disabled in read-only mode.

import React from "react";
import { AutoAddressButton } from "@/modules/DaliDesigner/Toolbar/buttons/AutoAddressButton";
import { ManualAddressButton } from "@/modules/DaliDesigner/Toolbar/buttons/ManualAddressButton";
import { useDaliLockState } from "@/modules/DaliDesigner/hooks/useDaliLockState";

export function AddressingGroup() {
  const { isReadOnly, lockedByUsername } = useDaliLockState();

  return (
    <div
      className="tb-group tb-addressing"
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
      <AutoAddressButton />
      <ManualAddressButton />
    </div>
  );
}