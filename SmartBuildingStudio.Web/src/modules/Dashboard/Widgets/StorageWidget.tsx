// src/modules/Dashboard/Widgets/StorageWidget.tsx
//
// Storage widget. Fetches real storage metrics from /api/v1/storage/stats.
// Falls back to summing document FileSizeInBytes from the ProjectExplorer
// tree if the dedicated endpoint isn't available yet (e.g. backend still
// being deployed). Removes the previous hardcoded 0.45 GB seed and 10 GB
// fake max — the widget shows what the backend actually reports.

import { useMemo, useState, useEffect } from "react";

interface StorageStats {
  usedBytes: number;
  maxBytes: number;
  docCount: number;
  generatedAt: string;
}

export default function StorageWidget() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptimising, setIsOptimising] = useState(false);
  const [source, setSource] = useState<"stats" | "tree" | "none">("none");

  // Try the dedicated stats endpoint first, fall back to tree sum.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      // 1. Try /api/v1/storage/stats
      try {
        const r = await fetch("/api/v1/storage/stats");
        if (r.ok) {
          const data = await r.json();
          if (cancelled) return;
          setStats({
            usedBytes: Number(data.usedBytes) || 0,
            maxBytes: Number(data.maxBytes) || 0,
            docCount: Number(data.docCount) || 0,
            generatedAt: data.generatedAt || new Date().toISOString(),
          });
          setSource("stats");
          setIsLoading(false);
          return;
        }
      } catch {
        // fall through to tree fallback
      }

      // 2. Fallback: sum document sizes from the ProjectExplorer tree
      try {
        const r = await fetch("/api/v1/project-explorer/tree");
        if (!r.ok) throw new Error("tree fetch failed");
        const tree = await r.json();
        let usedBytes = 0;
        let docCount = 0;

        (Array.isArray(tree) ? tree : []).forEach((p: any) => {
          (p.Buildings || p.buildings || []).forEach((b: any) => {
            (b.Floors || b.floors || []).forEach((f: any) => {
              (f.Documents || f.documents || []).forEach((d: any) => {
                docCount++;
                const sz = d.FileSizeInBytes ?? d.fileSizeInBytes;
                if (sz != null) usedBytes += Number(sz) || 0;
              });
            });
          });
        });

        if (cancelled) return;
        setStats({
          usedBytes,
          maxBytes: 0, // unknown — no backend max provided
          docCount,
          generatedAt: new Date().toISOString(),
        });
        setSource("tree");
        setIsLoading(false);
      } catch {
        if (cancelled) return;
        setStats(null);
        setSource("none");
        setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // Format bytes → human-friendly
  const usedLabel = useMemo(() => {
    if (!stats) return "—";
    const b = stats.usedBytes;
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(2)} MB`;
    return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }, [stats]);

  const maxLabel = useMemo(() => {
    if (!stats || !stats.maxBytes) return null;
    const b = stats.maxBytes;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
    return `${(b / 1024 / 1024 / 1024).toFixed(1)} GB`;
  }, [stats]);

  const percentage = useMemo(() => {
    if (!stats || !stats.maxBytes) return null;
    return Math.min(100, Math.round((stats.usedBytes / stats.maxBytes) * 100));
  }, [stats]);

  const handleOptimiseIndex = async () => {
    if (isOptimising) return;
    setIsOptimising(true);
    try {
      const r = await fetch("/api/v1/storage/optimize", { method: "POST" });
      if (!r.ok) throw new Error(`Server returned ${r.status}`);
      // Refetch stats after optimization
      const sr = await fetch("/api/v1/storage/stats");
      if (sr.ok) {
        const data = await sr.json();
        setStats({
          usedBytes: Number(data.usedBytes) || 0,
          maxBytes: Number(data.maxBytes) || 0,
          docCount: Number(data.docCount) || 0,
          generatedAt: data.generatedAt || new Date().toISOString(),
        });
        setSource("stats");
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[StorageWidget] Optimize failed:", err);
    } finally {
      setIsOptimising(false);
    }
  };

  const optimiseDisabled = isOptimising || isLoading || source !== "stats";

  return (
    <div style={{ background: "rgba(22, 30, 49, 0.4)", border: "1px solid #1E293B", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: "96px", height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,210,255,0.3))" }} />

      <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #1E293B", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg style={{ width: "16px", height: "16px", color: "#00D2FF" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="8" x="2" y="3" rx="2"/><rect width="20" height="8" x="2" y="13" rx="2"/><line x1="6" y1="7" x2="6.01" y2="7"/><line x1="6" y1="17" x2="6.01" y2="17"/></svg>
          <div>
            <h3 style={{ fontSize: "10px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase", margin: 0, letterSpacing: "0.1em" }}>Repository Allocation</h3>
            <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#FFF", margin: "2px 0 0 0", fontFamily: "sans-serif" }}>Database Storage</h2>
          </div>
        </div>
        {source === "tree" && (
          <span
            style={{ fontSize: "9px", fontFamily: "monospace", color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", padding: "2px 6px", borderRadius: "4px" }}
            title="Storage endpoint not available — showing document sizes only"
          >
            PARTIAL
          </span>
        )}
      </div>

      <div style={{ background: "#090D16", padding: "14px", borderRadius: "12px", border: "1px solid #1E293B", display: "flex", flexDirection: "column", gap: "10px", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "2px", background: "#00D2FF", opacity: 0.6 }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "4px" }}>
          <span style={{ color: "#64748B", fontSize: "11px", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "6px" }}>
            <svg style={{ width: "12px", height: "12px", color: "#475569" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><rect width="6" height="16" x="2" y="4"/></svg>
            Used Footprint //
          </span>
          <span style={{ fontSize: "13px", fontWeight: "bold", color: "#00D2FF", fontFamily: "monospace" }}>
            {isLoading ? ".." : usedLabel}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "4px", borderTop: "1px solid rgba(30,41,59,0.4)", paddingTop: "10px" }}>
          <span style={{ color: "#64748B", fontSize: "11px", fontFamily: "monospace" }}>Maximum Cap //</span>
          <span style={{ color: maxLabel ? "#E2E8F0" : "#64748B", fontWeight: "bold", background: "#080B14", border: "1px solid #1E293B", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontFamily: "monospace" }}>
            {isLoading ? ".." : (maxLabel ?? "n/a")}
          </span>
        </div>
      </div>

      <div style={{ marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase" }}>
          <span>Storage Index</span>
          <span style={{ color: "#94A3B8", fontWeight: "bold" }}>
            {percentage != null ? `${percentage}% Allocation` : "unavailable"}
          </span>
        </div>

        <div style={{ height: "6px", background: "#090D16", borderRadius: "4px", margin: "8px 0", overflow: "hidden", border: "1px solid #1E293B" }}>
          <div
            style={{
              width: percentage != null ? `${percentage}%` : "0%",
              height: "100%",
              background: "linear-gradient(90deg, #00D2FF, #05FFC4)",
              boxShadow: "0 0 10px rgba(5,255,196,0.3)",
              transition: "width 0.5s ease-out",
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: "12px", borderTop: "1px solid rgba(30,41,59,0.3)", paddingTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={handleOptimiseIndex}
          disabled={optimiseDisabled}
          title={source !== "stats" ? "Optimization requires the /api/v1/storage/stats endpoint" : undefined}
          style={{
            background: "none",
            border: "1px solid #1E293B",
            padding: "4px 10px",
            borderRadius: "6px",
            color: optimiseDisabled ? "#475569" : "#64748B",
            fontSize: "10px",
            fontFamily: "monospace",
            cursor: optimiseDisabled ? "not-allowed" : "pointer",
            outline: "none",
            transition: "all 0.15s",
          }}
          className={optimiseDisabled ? "" : "hover:border-sky-500/40 hover:text-sky-400"}
        >
          {isOptimising ? "Compressing Blocks..." : "Optimise Index"}
        </button>
        <div style={{ fontSize: "9px", color: "#475569", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {stats?.docCount != null && stats.docCount > 0 ? `${stats.docCount} documents` : "No documents"}
        </div>
      </div>
    </div>
  );
}