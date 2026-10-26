// src/modules/Dashboard/Layout/DashboardHeader.tsx
//
// Dashboard command header. Functional only — search, sync status,
// refresh, user identity. Branding lives in the sidebar (AppShell),
// which is persistent across all pages. Removing it here avoids two
// competing logos.

import { UseDashboard } from "@/modules/Dashboard/Hooks/UseDashboard";

export default function DashboardHeader() {
  const { health, filters, searchProjects, triggerRefresh, loading } = UseDashboard();

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 50, width: "100%", userSelect: "none" }}>

      {/* GLOBAL SYSTEM INTENSITY LASER RIBBON */}
      <div style={{ width: "100%", height: "2px", background: "linear-gradient(90deg, #00D2FF, #05FFC4, #FFB800)", boxShadow: "0 1px 15px rgba(5,255,196,0.4)" }} />

      {/* COMPONENT COMMAND HEADER DECK */}
      <header style={{ width: "100%", height: "64px", background: "#080B14", borderBottom: "1px solid #1E293B", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", boxSizing: "border-box" }}>

        {/* CENTRAL HUD SEARCH BAR (takes the space that used to hold branding) */}
        <div style={{ flex: 1, maxWidth: "720px", position: "relative" }}>
          <span style={{ position: "absolute", left: "14px", top: "11px", fontSize: "12px", color: "#475569" }}>
            <svg style={{ width: "12px", height: "12px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input
            type="text"
            value={filters?.projectQuery || ""}
            onChange={(e) => searchProjects && searchProjects(e.target.value)}
            placeholder="Search active engineering blueprints, clients, or site codes..."
            style={{ width: "100%", backgroundColor: "#070A12", border: "1px solid #1E293B", borderRadius: "12px", padding: "8px 36px 8px 38px", fontSize: "12px", color: "#E2E8F0", outline: "none", fontFamily: "monospace", boxSizing: "border-box" }}
          />
          {filters?.projectQuery && (
            <button
              onClick={() => searchProjects && searchProjects("")}
              style={{ position: "absolute", right: "12px", top: "10px", background: "none", border: "none", color: "#475569", cursor: "pointer", padding: "2px" }}
            >
              <svg style={{ width: "12px", height: "12px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {/* FUNCTIONAL SYSTEM STATUS CONTROLS */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>

          {/* HEARTBEAT TELEMETRY INDICATOR — clickable when pending */}
          <button
            type="button"
            onClick={() => {
              if (!health?.syncSynchronized && !loading) {
                triggerRefresh();
              }
            }}
            disabled={loading}
            title={
              health?.syncSynchronized
                ? "All data synchronised"
                : loading
                ? "Synchronising…"
                : "Click to force synchronisation"
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              borderRadius: "12px",
              background: "#090D16",
              border: "1px solid #1E293B",
              color: "inherit",
              fontFamily: "monospace",
              cursor: loading
                ? "wait"
                : health?.syncSynchronized
                ? "default"
                : "pointer",
            }}
          >
            <span style={{ position: "relative", display: "flex", height: "8px", width: "8px" }}>
              <span style={{ position: "absolute", display: "inline-flex", height: "100%", width: "100%", borderRadius: "50%", opacity: 0.75, animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite", background: health?.syncSynchronized ? "#05FFC4" : "#FFB800" }} />
              <span style={{ position: "relative", display: "inline-flex", borderRadius: "50%", height: "8px", width: "8px", background: health?.syncSynchronized ? "#05FFC4" : "#FFB800" }} />
            </span>
            <span style={{ fontSize: "9px", fontFamily: "monospace", fontWeight: "bold", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {health?.syncSynchronized ? "Cloud Synced" : "Pending Sync"}
            </span>
          </button>

          {/* GLOBAL REFRESH OPERATION COMMAND BUTTON */}
          <button
            onClick={triggerRefresh}
            disabled={loading}
            style={{ padding: "8px", borderRadius: "12px", background: "#090D16", border: "1px solid #1E293B", color: loading ? "#00D2FF" : "#64748B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Force Telemetry Synchronization"
          >
            <svg style={{ width: "14px", height: "14px", animation: loading ? "spin 1s linear infinite" : "none" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          </button>

          <div style={{ width: "1px", height: "20px", background: "rgba(30,41,59,0.6)" }} />

          {/* USER IDENTITY TAG */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "12px", background: "#090D16", border: "1px solid #1E293B", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontFamily: "monospace", fontSize: "12px", color: "#00D2FF" }}>
              EE
            </div>
            <div style={{ textAlign: "left", fontFamily: "sans-serif" }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#E2E8F0", letterSpacing: "0.02em" }}>Electrical Engineer</div>
              <div style={{ fontSize: "9px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase", fontWeight: "bold", marginTop: "2px" }}>
                Access: <span style={{ color: "#05FFC4" }}>Lead</span>
              </div>
            </div>
          </div>

        </div>
      </header>
    </div>
  );
}