// src/modules/DaliDesigner/Sidebar/DaliSidebar.tsx
import React from "react";
import { DaliLineExplorer } from "@/modules/DaliDesigner/Sidebar/DaliLineExplorer";
import { DeviceTree } from "@/modules/DaliDesigner/Sidebar/DeviceTree";
import { GroupExplorer } from "@/modules/DaliDesigner/Sidebar/GroupExplorer";
import { SceneExplorer } from "@/modules/DaliDesigner/Sidebar/SceneExplorer";

export function DaliSidebar() {
  return (
    <aside
      className="dali-sidebar"
      style={{
        width: 260,
        flexShrink: 0,       // ← add
        minHeight: 0,        // ← add
        background: "#1e1e1e",
        borderRight: "1px solid #333",
        overflowY: "auto",
        padding: 8,
      }}
    >
      <DaliLineExplorer />
      <DeviceTree />
      <GroupExplorer />
      <SceneExplorer />
    </aside>
  );
}