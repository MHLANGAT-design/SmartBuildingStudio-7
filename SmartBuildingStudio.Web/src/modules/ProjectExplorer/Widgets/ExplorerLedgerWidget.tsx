// src/modules/ProjectExplorer/Widgets/ExplorerLedgerWidget.tsx

import React from 'react';

interface ExplorerLedgerWidgetProps {
  projects: any[];
  loading: boolean;
}

export default function ExplorerLedgerWidget({ projects, loading }: ExplorerLedgerWidgetProps) {
  return (
    <div style={{ background: "rgba(11, 15, 25, 0.4)", border: "1px solid #1E293B", borderRadius: "16px", overflow: "hidden", backdropFilter: "blur(12px)", boxSizing: "border-box" }}>
      <div style={{ padding: "16px", borderBottom: "1px solid #1E293B", background: "rgba(15, 23, 42, 0.4)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px" }}>🏢</span>
          <h3 style={{ fontSize: "11px", fontWeight: "bold", fontFamily: "monospace", textTransform: "uppercase", color: "#CBD5E1", margin: 0, letterSpacing: "0.05em" }}>Database Storage Records</h3>
        </div>
        <span style={{ fontSize: "9px", fontFamily: "monospace", padding: "2px 8px", borderRadius: "4px", background: "#03060C", border: "1px solid #1E293B", color: "#64748B", textTransform: "uppercase" }}>
          Context Count: {projects?.length || 0}
        </span>
      </div>

      <div style={{ overflowX: "auto", width: "100%" }} className="industrial-scrollbar">
        <table style={{ width: "100%", fontFamily: "monospace", fontSize: "12px", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(30, 41, 59, 0.8)", background: "rgba(3, 6, 12, 0.4)", color: "#64748B", fontSize: "10px", textTransform: "uppercase" }}>
              <th style={{ padding: "12px 16px", fontWeight: "600" }}>Scope Identity</th>
              <th style={{ padding: "12px 16px", fontWeight: "600" }}>Client Name</th>
              <th style={{ padding: "12px 16px", fontWeight: "600", textAlign: "center" }}>Buildings</th>
              <th style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>Project Code</th>
            </tr>
          </thead>
          <tbody style={{ color: "#E2E8F0" }}>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "#64748B" }}>🔄 Running deep SQL server disk parsing routines...</td></tr>
            ) : projects && projects.length > 0 ? (
              projects.map((proj: any, idx: number) => (
                <tr key={proj.id || idx} style={{ borderBottom: "1px solid rgba(30, 41, 59, 0.3)" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(6, 182, 212, 0.04)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                  <td style={{ padding: "14px 16px", fontWeight: "bold", color: "#FFF" }}>{proj.name}</td>
                  <td style={{ padding: "14px 16px", color: "#94A3B8" }}>{proj.clientName || 'External Context'}</td>
                  <td style={{ padding: "14px 16px", textAlign: "center", color: "#94A3B8", fontWeight: "bold" }}>{proj.buildings?.length || 0} Blocks</td>
                  <td style={{ padding: "14px 16px", textAlign: "right", color: "#00D2FF", fontWeight: "bold" }}>{proj.projectNumber || 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ padding: "48px", textAlign: "center" }}>
                  <div style={{ color: "#64748B", fontSize: "13px" }}>No Active Subnets Registered on Disk Drive</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}