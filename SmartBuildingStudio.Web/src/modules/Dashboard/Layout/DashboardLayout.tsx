import React from "react";
import DashboardHeader from "@/modules/Dashboard/Layout/DashboardHeader";
import { UseDashboard } from "@/modules/Dashboard/Hooks/UseDashboard";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { error } = UseDashboard();

  const handleReload = () => window.location.reload();

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", fontFamily: "sans-serif", overflow: "hidden", backgroundColor: "#0B0F19", color: "#E2E8F0" }}>
      {/* GLOBAL HUD COMMAND HEADER */}
      <DashboardHeader />

      {/* CORE VIEWPORT MATRICES CONTAINER */}
      <main style={{ position: "relative", flex: 1, overflowY: "auto", paddingBottom: "48px", background: "radial-gradient(ellipse at top, rgba(15,20,36,0.5), transparent 60%)", boxSizing: "border-box" }}>
        
        {/* TACTICAL SYSTEM FAULT NOTIFICATION STRIP */}
        {error && (
          <div style={{ margin: "24px 24px 0 24px", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "12px", border: "1px solid #1E293B", borderLeft: "2px solid #F43F5E", userSelect: "none", fontSize: "12px", fontWeight: "500", backgroundColor: "#0A0F1D", boxShadow: "0 25px 50px -12px rgba(244,63,94,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <svg style={{ width: "16px", height: "16px", color: "#F43F5E", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <span style={{ fontFamily: "monospace", fontWeight: "bold", textTransform: "uppercase", color: "#F43F5E", marginRight: "8px" }}>System Fault //</span>
                <span style={{ color: "#94A3B8" }}>{error}</span>
              </div>
            </div>
            
            <button 
              onClick={handleReload}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(244,63,94,0.3)", fontSize: "10px", fontFamily: "monospace", fontWeight: "bold", textTransform: "uppercase", color: "#F43F5E", backgroundColor: "rgba(244,63,94,0.1)", cursor: "pointer", outline: "none" }}
            >
              <svg style={{ width: "12px", height: "12px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              Retry Connection
            </button>
          </div>
        )}

        {/* WORKSPACE CENTRAL MAIN ROW GRID SLOTS */}
        <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "24px", boxSizing: "border-box" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
