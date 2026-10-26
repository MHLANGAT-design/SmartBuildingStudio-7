import React from "react";
import { useAppSelector } from "@/Application/ConfigureStore";
// 🚀 FIXED: Imports filters directly to filter context items in real-time as you type!
import { selectExplorerFilters } from "@/modules/ProjectExplorer/Store/ProjectExplorerSelectors";

interface RecentActivityProps {
  scopeId: string;
}

export default function RecentActivity({ scopeId }: RecentActivityProps) {
  const filters = useAppSelector(selectExplorerFilters);
  const query = (filters?.searchQuery || "").trim().toLowerCase();

  const allLogs = [
    { text: "Calibrated real-world distance metrics factor to 1.25m per coordinate unit segment.", time: "10m ago", status: "✓" },
    { text: "Bifurcated corridor wall boundary vectors executing split commands.", time: "1h ago", status: "✓" },
    { text: "Automated network constraint audit: Identified loop overload on Channel B line grid.", time: "3h ago", status: "⚠" }
  ];

  // 🚀 FIXED: Filters log records dynamically based on your search query input string
  const filteredLogs = allLogs.filter(log => {
    if (!query) return true;
    return log.text.toLowerCase().includes(query);
  });

  return (
    <div style={{ background: "rgba(22, 30, 49, 0.4)", border: "1px solid #1E293B", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", boxSizing: "border-box" }}>
      
      {/* SECTION HEADER BLOCK */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1E293B", paddingBottom: "12px", marginBottom: "4px" }}>
        <div>
          <h3 style={{ fontSize: "10px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase", margin: 0, letterSpacing: "0.1em" }}>
            Context Activity Timeline Logs
          </h3>
          <div style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "monospace", marginTop: "4px" }}>
            SCOPE TRACKER TARGET // <span style={{ color: "#00D2FF", fontWeight: "bold" }}>{scopeId || "GLOBAL_ROOT"}</span>
          </div>
        </div>
        <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#05FFC4", backgroundColor: "rgba(5,255,196,0.1)", border: "1px solid rgba(5,255,196,0.2)", padding: "2px 8px", borderRadius: "6px" }}>STREAM REGULAR</span>
      </div>

      {/* CORE LOG ENTRIES TIMELINE */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filteredLogs.length === 0 ? (
          <div style={{ padding: "16px", textAlign: "center", color: "#475569", fontSize: "11px", fontFamily: "monospace" }}>
            No log entries match your active text filter query.
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const isCheck = log.status === "✓";
            const statusColor = isCheck ? "#05FFC4" : "#FFB800";
            const itemBg = isCheck ? "rgba(5,255,196,0.01)" : "rgba(255,184,0,0.01)";

            return (
              <div 
                key={idx} 
                style={{ padding: "14px", background: "#090D16", backgroundColor: itemBg, border: "1px solid #1E293B", borderLeft: `3px solid ${statusColor}`, borderRadius: "0 12px 12px 0", display: "flex", alignItems: "start", gap: "12px" }}
              >
                <span style={{ fontSize: "14px", fontWeight: "bold", color: statusColor, lineHeight: "1", marginTop: "1px", fontFamily: "monospace" }}>
                  {log.status}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "#E2E8F0", fontFamily: "sans-serif", lineHeight: "1.5" }}>
                    {log.text}
                  </p>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", fontFamily: "monospace", color: "#64748B", marginTop: "8px" }}>
                    <svg style={{ width: "11px", height: "11px", color: "#475569" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {log.time}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
    </div>
  );
}
