import React from 'react';
// Import your pre-existing group coordination containers
import FileGroup from '@/modules/ProjectExplorer/Toolbar/Groups/FileGroup';
import ProjectGroup from '@/modules/ProjectExplorer/Toolbar/Groups/ProjectGroup';
import ViewGroup from '@/modules/ProjectExplorer/Toolbar/Groups/ViewGroup';
import SearchGroup from '@/modules/ProjectExplorer/Toolbar/Groups/SearchGroup';

interface ExplorerToolbarWidgetProps {
  selectedNode?: any;
  selectedNodeId?: string | null;
}

export default function ExplorerToolbarWidget({ 
  selectedNode, 
  selectedNodeId 
}: ExplorerToolbarWidgetProps) {
  return (
    <div style={{ 
      background: "rgba(11, 15, 25, 0.6)", 
      border: "1px solid #1E293B", 
      borderRadius: "16px", 
      padding: "12px 20px", 
      display: "flex", 
      flexDirection: "row", 
      alignItems: "center", 
      justifyContent: "space-between", 
      gap: "24px",
      backdropFilter: "blur(12px)",
      boxSizing: "border-box",
      position: "relative"
    }}>
      {/* GLOWING AMBER UNDERLAY DECORATIVE RIBBON */}
      <div style={{ position: "absolute", bottom: 0, left: "20px", right: "24px", height: "1px", background: "linear-gradient(90deg, #FFB800, transparent)" }} />

      {/* LEFT SECTION: DATA & SCHEMA OPERATIONS */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em" }}>File Core</span>
          {/* 🚀 FIXED: Propagate selection context to subforms */}
          <FileGroup selectedNode={selectedNode} selectedNodeId={selectedNodeId} />
        </div>
        <div style={{ height: "32px", width: "1px", background: "#1E293B" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em" }}>Schema Context</span>
          {/* 🚀 FIXED: Injects active selection targets to instantly unlock Rename, Delete, and Open commands! */}
          <ProjectGroup selectedNode={selectedNode} selectedNodeId={selectedNodeId} />
        </div>
      </div>

      {/* RIGHT SECTION: STRUCTURAL VIEWS & LOOKUP MATRIX */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
          <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em" }}>Tree Expansion</span>
          <ViewGroup />
        </div>
        <div style={{ height: "32px", width: "1px", background: "#1E293B" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
          <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em" }}>Filter Focus</span>
          <SearchGroup />
        </div>
      </div>

    </div>
  );
}
