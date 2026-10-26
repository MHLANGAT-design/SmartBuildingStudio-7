import React from "react";
import { useAppSelector } from "@/Application/ConfigureStore";
// 🚀 FIXED: Injected selectFilteredNodes to verify if the highlighted project is hidden by search parameters
import { selectSelectedNode, selectExplorerStatistics, selectFilteredNodes } from "@/modules/ProjectExplorer/Store/ProjectExplorerSelectors";
import RecentActivity from "@/modules/ProjectExplorer/Content/RecentActivity";

export default function ProjectSummary() {
  const selectedNode = useAppSelector(selectSelectedNode);
  const statistics = useAppSelector(selectExplorerStatistics);
  const filteredNodes = useAppSelector(selectFilteredNodes);

  if (!selectedNode || selectedNode.type !== "Project") return null;

  // 🚀 FIXED: Checks if the currently selected project is hidden by active search keywords
  const isProjectVisible = filteredNodes.some((n: any) => n && n.id === selectedNode.id);

  if (!isProjectVisible) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#475569", border: "1px dashed #1E293B", borderRadius: "16px", fontFamily: "monospace", fontSize: "12px", background: "#090D16" }}>
        ⚠️ Highlighted project "{selectedNode.name}" is excluded by your active query search criteria filters.
      </div>
    );
  }

  const errorCount = selectedNode.validationErrorCount || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", boxSizing: "border-box", userSelect: "none" }}>
      
      {/* STRUCTURAL HEADER HERO MATRIX WITH ASYMMETRICAL RIBBON */}
      <div style={{ position: "relative", background: "linear-gradient(90deg, #111827, #0F1424)", border: "1px solid #1E293B", borderRadius: "16px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", boxShadow: "0 4px 30px rgba(0,0,0,0.2)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: "linear-gradient(180deg, #00D2FF, #05FFC4)" }} />
        
        <div style={{ paddingLeft: "8px" }}>
          <span style={{ fontSize: "9px", fontFamily: "monospace", fontWeight: "bold", color: "#00D2FF", backgroundColor: "rgba(0,210,255,0.1)", border: "1px solid rgba(0,210,255,0.2)", padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Project Scope Root
          </span>
          <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#FFF", margin: "8px 0 0 0", fontFamily: "sans-serif" }}>{selectedNode.name}</h2>
          <p style={{ fontSize: "10px", fontFamily: "monospace", color: "#64748B", margin: "4px 0 0 0" }}>ID ANCHOR // {selectedNode.id}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontFamily: "monospace" }}>
          <span style={{ color: "#64748B" }}>Mod By:</span>
          <span style={{ color: "#E2E8F0", background: "#090D16", border: "1px solid #1E293B", padding: "4px 10px", borderRadius: "8px", fontWeight: "bold" }}>
            {selectedNode.modifiedBy || "System Daemon"}
          </span>
        </div>
      </div>

      {/* HIGH-DENSITY CARD BLOCKS GRID MONITOR (FOUR CELLS) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
        {[
          { title: "Buildings Managed", value: statistics?.buildingCount ?? 0, color: "#3B82F6" },
          { title: "Total Floor Levels", value: statistics?.floorCount ?? 0, color: "#A855F7" },
          { title: "Network DALI Loops", value: statistics?.daliNetworkCount ?? 0, color: "#05FFC4" },
          { title: "Rule Audit Faults", value: errorCount, color: errorCount > 0 ? "#F43F5E" : "#475569" }
        ].map((card, idx) => (
          <div key={idx} style={{ background: "rgba(22, 30, 49, 0.4)", border: "1px solid #1E293B", borderRadius: "14px", padding: "14px", textAlign: "center", boxSizing: "border-box" }}>
            <span style={{ display: "block", fontSize: "10px", fontFamily: "sans-serif", fontWeight: "bold", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              {card.title}
            </span>
            <span style={{ fontSize: "20px", fontWeight: "bold", fontFamily: "monospace", color: card.color, textShadow: card.color !== "#475569" ? `0 0 10px ${card.color}33` : "none" }}>
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* NESTED DYNAMIC CONTEXT TIMELINE FEED */}
      <RecentActivity scopeId={selectedNode.id} />
      
    </div>
  );
}
