// src/modules/DaliDesigner/Toolbar/groups/ValidationGroup.tsx
//
// LEVEL 1 LOCK ENFORCEMENT: Validate is a read operation (reports
// errors without changing anything) — stays enabled. Commission
// changes device state on the bus AND typically writes — gate it.

import React from "react";
import { ValidateNetworkButton } from "@/modules/DaliDesigner/Toolbar/buttons/ValidateNetworkButton";
import { CommissionButton } from "@/modules/DaliDesigner/Toolbar/buttons/CommissionButton";
import { useDaliLockState } from "@/modules/DaliDesigner/hooks/useDaliLockState";

export function ValidationGroup() {
  const { isReadOnly, lockedByUsername } = useDaliLockState();

  return (
    <div className="tb-group tb-validation">
      <ValidateNetworkButton />
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
        <CommissionButton />
      </div>
    </div>
  );
}