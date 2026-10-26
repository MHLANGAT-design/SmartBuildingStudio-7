import React, { useState } from 'react';
import { useAppSelector } from "@/Application/ConfigureStore";
import { selectExplorerLoading } from "@/modules/ProjectExplorer/Store/ProjectExplorerSelectors";

import ExplorerSearch from "@/modules/ProjectExplorer/Sidebar/ExplorerSearch";
import ExplorerFilters from "@/modules/ProjectExplorer/Sidebar/ExplorerFilters";
import ExplorerStatistics from "@/modules/ProjectExplorer/Sidebar/ExplorerStatistics";
import ProjectTree from "@/modules/ProjectExplorer/Sidebar/ProjectTree";

export default function ExplorerSidebarWidget() {
  const loading = useAppSelector(selectExplorerLoading);

  // Search + statistics are collapsed by default so the tree gets maximum
  // vertical space. Users expand them when actively filtering.
  const [searchOpen, setSearchOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  return (
    <div
      style={{
        background: "rgba(22, 30, 49, 0.4)",
        border: "1px solid #1E293B",
        borderRadius: "16px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        boxSizing: "border-box",
        backdropFilter: "blur(12px)",
        height: "100%",
        minHeight: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, #3B82F6, #05FFC4, transparent)" }} />

      {/* ── Compact header ───────────────────────────────────────── */}
      <div
        style={{
          paddingBottom: "8px",
          borderBottom: "1px solid #1E293B",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", filter: "drop-shadow(0 0 8px #3B82F6)" }}>📁</span>
          <h2 style={{ fontSize: "12px", fontWeight: "bold", color: "#FFF", margin: 0, fontFamily: "sans-serif" }}>
            Project Explorer
          </h2>
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "9px",
            padding: "2px 6px",
            borderRadius: "4px",
            background: loading ? "rgba(245,158,11,0.1)" : "rgba(5,255,196,0.1)",
            border: loading ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(5,255,196,0.2)",
            color: loading ? "#F59E0B" : "#05FFC4",
          }}
        >
          {loading ? "PARSING..." : "READY"}
        </div>
      </div>

      {/* ── Search: collapsed by default ─────────────────────────── */}
      <div style={{ flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          style={{
            width: "100%",
            padding: "6px 10px",
            background: searchOpen ? "rgba(9, 13, 22, 0.6)" : "transparent",
            border: "1px solid #1E293B",
            borderRadius: 6,
            color: "#94A3B8",
            fontFamily: "monospace",
            fontSize: 10,
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Search & Filters</span>
          <span style={{ transition: "transform 0.15s", transform: searchOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
        </button>
        {searchOpen && (
          <div
            style={{
              marginTop: 6,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              background: "rgba(9, 13, 22, 0.4)",
              padding: 10,
              borderRadius: 8,
              border: "1px solid rgba(30, 41, 59, 0.5)",
            }}
          >
            <ExplorerSearch />
            <ExplorerFilters />
          </div>
        )}
      </div>

      {/* ── Statistics: collapsed by default ─────────────────────── */}
      <div style={{ flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setStatsOpen((v) => !v)}
          style={{
            width: "100%",
            padding: "6px 10px",
            background: statsOpen ? "rgba(9, 13, 22, 0.6)" : "transparent",
            border: "1px solid #1E293B",
            borderRadius: 6,
            color: "#94A3B8",
            fontFamily: "monospace",
            fontSize: 10,
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Statistics</span>
          <span style={{ transition: "transform 0.15s", transform: statsOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
        </button>
        {statsOpen && (
          <div style={{ marginTop: 6, background: "rgba(3, 6, 12, 0.3)", padding: 4, borderRadius: 8 }}>
            <ExplorerStatistics />
          </div>
        )}
      </div>

      {/* ── Tree: takes all remaining space ──────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            background: "#050912",
            border: "1px solid #1E293B",
            borderRadius: 12,
            padding: 8,
            boxSizing: "border-box",
          }}
          className="industrial-scrollbar"
        >
          <ProjectTree />
        </div>
      </div>

      {/* ── Footer: minimal ──────────────────────────────────────── */}
      <div
        style={{
          paddingTop: 6,
          borderTop: "1px solid #1E293B",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 9,
          fontFamily: "monospace",
          color: "#475569",
          flexShrink: 0,
        }}
      >
        <span>TREE ACTIVE</span>
        <span style={{ color: "#3B82F6" }}>SBS</span>
      </div>
    </div>
  );
}