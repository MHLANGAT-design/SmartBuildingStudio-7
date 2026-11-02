// src/modules/DaliDesigner/Toolbar/DaliToolbar.tsx
//
// LEVEL 1 LOCK ENFORCEMENT: shows a "READ-ONLY" badge when the source
// floorplan document is locked by another user. Individual groups gate
// their own write buttons via useDaliLockState().

import React from "react";
import { NetworkGroup } from "./groups/NetworkGroup";
import { DeviceGroup } from "./groups/DeviceGroup";
import { AddressingGroup } from "./groups/AddressingGroup";
import { SceneGroup } from "./groups/SceneGroup";
import { GroupingGroup } from "./groups/GroupingGroup";
import { ValidationGroup } from "./groups/ValidationGroup";
import { useDaliLockState } from "@/modules/DaliDesigner/hooks/useDaliLockState";
import { OpenProgrammingStudioButton } from "@/modules/DaliDesigner/Toolbar/buttons/OpenProgrammingStudioButton";

export function DaliToolbar() {
  const { isReadOnly, lockedByUsername } = useDaliLockState();

  return (
    <div className="dali-toolbar" style={{ position: "relative" }}>
      <NetworkGroup />
      <DeviceGroup />
      <AddressingGroup />
      <GroupingGroup />
      <SceneGroup />
      <ValidationGroup />

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <OpenProgrammingStudioButton />
        {isReadOnly && (
          <span
            style={readOnlyBadge}
            title={`Locked by ${lockedByUsername || "another user"}`}
          >
            🔒 READ-ONLY
          </span>
        )}
      </div>
    </div>
  );
}

const readOnlyBadge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  fontSize: 10,
  fontFamily: "monospace",
  fontWeight: "bold",
  color: "#FFB800",
  background: "rgba(255, 184, 0, 0.12)",
  border: "1px solid rgba(255, 184, 0, 0.4)",
  borderRadius: 4,
  padding: "3px 8px",
  letterSpacing: "0.05em",
};

export default DaliToolbar;