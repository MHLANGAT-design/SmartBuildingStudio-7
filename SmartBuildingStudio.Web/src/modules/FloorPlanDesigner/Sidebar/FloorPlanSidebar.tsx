// src/modules/FloorPlanDesigner/Sidebar/FloorPlanSidebar.tsx

import React, { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { toggleSidebarLeft } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

import DrawingExplorer from "@/modules/FloorPlanDesigner/Sidebar/DrawingExplorer";
import FloorExplorer from "@/modules/FloorPlanDesigner/Sidebar/FloorExplorer";
import RoomExplorer from "@/modules/FloorPlanDesigner/Sidebar/RoomExplorer";
import LayerExplorer from "@/modules/FloorPlanDesigner/Sidebar/LayerExplorer";
import ComponentExplorer from "@/modules/FloorPlanDesigner/Sidebar/ComponentExplorer";

type SidebarTab = "drawings" | "components" | "floors" | "rooms" | "layers";

interface FloorPlanSidebarProps {
  toolManager: any;
  toolContext: any;
  isReadOnly?: boolean;
}

export default function FloorPlanSidebar({
  toolManager,
  toolContext,
  isReadOnly = false,
}: FloorPlanSidebarProps) {
  const dispatch = useAppDispatch();
  
  const leftSidebarVisible = useAppSelector((state: any) => {
    const slice = state?.floorPlan || state?.FloorPlan;
    return slice?.ui?.leftSidebarVisible ?? slice?.leftSidebarVisible ?? true;
  });
  
  const [activeTab, setActiveTab] = useState<SidebarTab>("drawings");

  const displayStyleWidth = leftSidebarVisible ? "320px" : "64px";
  const isExpandedMode = !!leftSidebarVisible;

  const tabs: { id: SidebarTab; label: string; icon: string; color: string }[] = [
    { id: "drawings", label: "Drawings", icon: "📁", color: "#A855F7" },
    { id: "components", label: "Elements", icon: "📐", color: "#EAB308" },
    { id: "floors", label: "Floors", icon: "🏢", color: "#00D2FF" },
    { id: "rooms", label: "Rooms", icon: "🚪", color: "#FFB800" },
    { id: "layers", label: "Layers", icon: "🥞", color: "#05FFC4" },
  ];

  return (
    <aside style={{ 
      width: displayStyleWidth, 
      height: "100%", 
      background: "#0F1424", 
      borderRight: "1px solid #1E293B", 
      display: "flex", 
      flexDirection: "column", 
      boxSizing: "border-box", 
      userSelect: "none",
      transition: "width 0.2s ease-in-out",
      overflow: "hidden"
    }}>
      
      {isExpandedMode && (
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #1E293B", background: "linear-gradient(180deg, #111827, #0F1424)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: "linear-gradient(180deg, #A855F7, #00D2FF)", boxShadow: "0 0 8px #00D2FF" }} />
          <div style={{ paddingLeft: "4px" }}>
            <h3 style={{ fontSize: "9px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase", margin: 0, letterSpacing: "0.1em" }}>Spatial Data</h3>
            <h2 style={{ fontSize: "13px", fontWeight: "bold", color: "#FFF", margin: "2px 0 0 0", fontFamily: "sans-serif", letterSpacing: "0.05em" }}>Designer Navigator</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              try { dispatch(toggleSidebarLeft()); } catch (e) {}
            }}
            style={{ background: "none", border: "none", color: "#64748B", fontSize: "11px", cursor: "pointer", transition: "color 0.15s", outline: "none" }}
            className="hover:text-slate-200"
            title="Collapse Navigator Sidebar"
          >
            ✕
          </button>
        </div>
      )}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", width: "100%" }}>
        <nav style={{ width: "64px", background: "#090D16", borderRight: "1px solid #1E293B", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "12px", gap: "10px", boxSizing: "border-box", flexShrink: 0 }}>
          {tabs.map((tab) => {
            const isCurrentActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{ width: "48px", height: "48px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: "8px", background: isCurrentActive ? "rgba(30,41,59,0.5)" : "transparent", border: `1px solid ${isCurrentActive ? tab.color : "transparent"}`, color: isCurrentActive ? "#FFF" : "#475569", transition: "all 0.15s ease", cursor: "pointer", outline: "none", gap: "2px", boxShadow: isCurrentActive ? `0 0 10px ${tab.color}15` : "none" }}
                title={tab.label}
              >
                <span style={{ fontSize: "16px" }}>{tab.icon}</span>
                <span style={{ fontSize: "9px", fontFamily: "monospace", color: isCurrentActive ? tab.color : "#475569", letterSpacing: "0.02em", fontWeight: isCurrentActive ? "bold" : "normal" }}>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {isExpandedMode ? (
          <div style={{ flex: 1, overflowY: "auto", background: "rgba(6, 9, 17, 0.4)", padding: "16px", boxSizing: "border-box" }}>
            {activeTab === "drawings" && (
              <DrawingExplorer
                toolManager={toolManager}
                toolContext={toolContext}
                isReadOnly={isReadOnly}
              />
            )}
            {activeTab === "components" && <ComponentExplorer toolManager={toolManager} toolContext={toolContext} />}
            {activeTab === "floors" && <FloorExplorer />}
            {activeTab === "rooms" && <RoomExplorer toolManager={toolManager} toolContext={toolContext} />}
            {activeTab === "layers" && <LayerExplorer toolManager={toolManager} toolContext={toolContext} />}
          </div>
        ) : (
          <div 
            onClick={() => { try { dispatch(toggleSidebarLeft()); } catch (e) {} }}
            style={{ flex: 1, background: "rgba(6,9,17,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: "10px", writingMode: "vertical-lr", textTransform: "uppercase", fontFamily: "monospace", letterSpacing: "0.1em" }}
          >
            Click to Expand Sidebar Navigator Map
          </div>
        )}
      </div>

      {isExpandedMode && (
        <div style={{ padding: "12px 14px", borderTop: "1px solid #1E293B", background: "#090D16", display: "flex", flexDirection: "column", gap: "6px", width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontFamily: "monospace", color: "#64748B" }}>
            <span>DALI SCANNING SUB-LOOPS //</span>
            <span style={{ color: "#05FFC4", fontWeight: "bold" }}>64/64 MAX</span>
          </div>
          <div style={{ height: "4px", background: "#0F1424", borderRadius: "2px", overflow: "hidden", border: "1px solid #1E293B" }}>
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, #A855F7, #05FFC4)" }} />
          </div>
        </div>
      )}

    </aside>
  );
}