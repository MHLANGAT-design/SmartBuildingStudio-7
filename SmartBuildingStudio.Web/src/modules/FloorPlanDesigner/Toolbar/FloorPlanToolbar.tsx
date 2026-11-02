// src/modules/FloorPlanDesigner/Toolbar/FloorPlanToolbar.tsx

import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/Application/ConfigureStore";
import { FloorPlanApi } from "@/modules/FloorPlanDesigner/Services/FloorPlanApi";
import { ToolManager } from "@/modules/FloorPlanDesigner/Tools/ToolManager";
import { DocumentManager } from "@/modules/FloorPlanDesigner/Document/DocumentManager";
import { FileGroup } from "@/modules/FloorPlanDesigner/Toolbar/Groups/FileGroup";
import { EditGroup } from "@/modules/FloorPlanDesigner/Toolbar/Groups/EditGroup";
import { ValidateGroup } from "@/modules/FloorPlanDesigner/Toolbar/Groups/ValidateGroup";
import { MeasureCalibrateGroup } from "@/modules/FloorPlanDesigner/Toolbar/Groups/MeasureCalibrateGroup";
import { setActiveTool } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice"; // <-- Import setActiveTool

export interface FloorPlanToolbarProps {
  api: FloorPlanApi;
  toolManager: ToolManager;
  documentManager: DocumentManager;
  isReadOnly?: boolean;
}

export const FloorPlanToolbar = ({
  api,
  toolManager,
  documentManager,
  isReadOnly = false,
}: FloorPlanToolbarProps) => {
  const [activeSection, setActiveSection] = useState<"draw" | "file" | "utility">("draw");
  const dispatch = useAppDispatch();
  const activeTool = useAppSelector((s: any) => s.floorPlan.activeTool); // <-- Read active tool

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
              onClick={() => setActiveSection(tab.id as "draw" | "file" | "utility")}
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
            
            {/* ADDED: SPLIT WALL BUTTON */}
            <div
              style={{
                width: "1px",
                height: "16px",
                background: "#1E293B",
                margin: "0 4px",
              }}
            />
            <button
              onClick={() => dispatch(setActiveTool("split-wall"))}
              disabled={isReadOnly}
              style={{
                background: activeTool === "split-wall" ? "rgba(56,189,248,0.2)" : "transparent",
                border: `1px solid ${activeTool === "split-wall" ? "#38BDF8" : "#334155"}`,
                color: activeTool === "split-wall" ? "#38BDF8" : "#94A3B8",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: "bold",
                fontFamily: "monospace",
                cursor: isReadOnly ? "not-allowed" : "pointer",
                opacity: isReadOnly ? 0.5 : 1,
              }}
              title="Split Wall"
            >
              ✂️ Split Wall
            </button>
          </div>
        )}

        {/* UTILITY */}
        {activeSection === "utility" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <MeasureCalibrateGroup isReadOnly={isReadOnly} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorPlanToolbar;