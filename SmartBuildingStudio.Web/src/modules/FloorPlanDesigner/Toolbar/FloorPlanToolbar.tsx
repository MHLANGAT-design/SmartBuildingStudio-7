// src/modules/FloorPlanDesigner/Toolbar/FloorPlanToolbar.tsx
// ✅ Viewport import removed – component no longer depends on it
//
// LEVEL 1 READ-ONLY: the toolbar accepts isReadOnly and forwards it
// to its child groups (ValidateGroup, FileGroup, EditGroup). Each group
// is responsible for disabling its own edit buttons when isReadOnly
// is true. Pan/zoom/select controls are NOT in this toolbar (they live
// in GlobalZoomControl), so read-only mode doesn't affect them.

import React, { useState } from "react";
import { FloorPlanApi } from "@/modules/FloorPlanDesigner/Services/FloorPlanApi";
import { ToolManager } from "@/modules/FloorPlanDesigner/Tools/ToolManager";
import { DocumentManager } from "@/modules/FloorPlanDesigner/Document/DocumentManager";
import { FileGroup } from "@/modules/FloorPlanDesigner/Toolbar/Groups/FileGroup";
import { EditGroup } from "@/modules/FloorPlanDesigner/Toolbar/Groups/EditGroup";
import { ValidateGroup } from "@/modules/FloorPlanDesigner/Toolbar/Groups/ValidateGroup";

export interface FloorPlanToolbarProps {
  api: FloorPlanApi;
  toolManager: ToolManager;
  documentManager: DocumentManager;
  /**
   * LEVEL 1 LOCK ENFORCEMENT — set by FloorPlanDesigner when the
   * document is locked by another user. Forwarded to child groups
   * so their edit buttons can be disabled.
   */
  isReadOnly?: boolean;
}

export const FloorPlanToolbar = ({
  api,
  toolManager,
  documentManager,
  isReadOnly = false,
}: FloorPlanToolbarProps) => {
  const [activeSection, setActiveSection] = useState<"draw" | "file" | "utility">("draw");

  return (
    <div
      style={{
        background: "#0F1424",
        borderBottom: "1px solid #1E293B",
        padding: "12px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxSizing: "border-box",
        width: "100%",
        userSelect: "none",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(30,41,59,0.4)",
          paddingBottom: "8px",
        }}
      >
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "draw", label: "Vector Assembly" },
            { id: "file", label: "Data Pipeline" },
            { id: "utility", label: "Canvas View" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              style={{
                background:
                  activeSection === tab.id
                    ? "rgba(0, 210, 255, 0.1)"
                    : "transparent",
                border:
                  activeSection === tab.id
                    ? "1px solid rgba(0, 210, 255, 0.3)"
                    : "1px solid transparent",
                color: activeSection === tab.id ? "#00D2FF" : "#64748B",
                padding: "4px 12px",
                borderRadius: "6px",
                fontSize: "10px",
                fontFamily: "monospace",
                fontWeight: "bold",
                textTransform: "uppercase",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "10px",
            fontFamily: "monospace",
          }}
        >
          <span style={{ color: "#475569" }}>CAD LINK STATUS //</span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(5,255,196,0.05)",
              border: "1px solid rgba(5,255,196,0.15)",
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            <span
              style={{
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                background: isReadOnly ? "#FFB800" : "#05FFC4",
                boxShadow: isReadOnly ? "0 0 6px #FFB800" : "0 0 6px #05FFC4",
              }}
            />
            <span style={{ color: isReadOnly ? "#FFB800" : "#05FFC4", fontWeight: "bold" }}>
              {isReadOnly ? "READ-ONLY" : "PORT 49235 ACTIVE"}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar sections */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          flexWrap: "wrap",
          minHeight: "36px",
        }}
      >
        {/* DRAW */}
        {activeSection === "draw" && (
          <div
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
            className="sbs-toolbar-group-fade"
          >
            <div
              style={{
                width: "1px",
                height: "16px",
                background: "#1E293B",
                margin: "0 4px",
              }}
            />
            <ValidateGroup api={api} isReadOnly={isReadOnly} />
          </div>
        )}

        {/* FILE */}
        {activeSection === "file" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileGroup api={api} isReadOnly={isReadOnly} />
            <div
              style={{
                width: "1px",
                height: "16px",
                background: "#1E293B",
                margin: "0 4px",
              }}
            />
            <EditGroup documentManager={documentManager} isReadOnly={isReadOnly} />
          </div>
        )}

        {/* UTILITY – now empty because ViewGroup was removed */}
        {activeSection === "utility" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* ViewGroup removed – you can add other utility buttons here later */}
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorPlanToolbar;