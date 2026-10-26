// src/modules/DaliDesigner/Toolbar/groups/DeviceGroup.tsx
//
// LEVEL 1 LOCK ENFORCEMENT: all four are edit operations.
// Disabled in read-only mode.

import React from "react";
import { ImportDevicesButton } from "@/modules/DaliDesigner/Toolbar/buttons/ImportDevicesButton";
import { AddDaliLineButton } from "@/modules/DaliDesigner/Toolbar/buttons/AddDaliLineButton";
import { AddControlDeviceButton } from "@/modules/DaliDesigner/Toolbar/buttons/AddControlDeviceButton";
import { SyncDevicesButton } from "@/modules/DaliDesigner/Toolbar/buttons/SyncDevicesButton";
import { useDaliLockState } from "@/modules/DaliDesigner/hooks/useDaliLockState";

export function DeviceGroup() {
  const { isReadOnly, lockedByUsername } = useDaliLockState();

  return (
    <div
      className="tb-group tb-device"
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
      <ImportDevicesButton />
      <AddDaliLineButton />
      <AddControlDeviceButton />
      <SyncDevicesButton />
    </div>
  );
}