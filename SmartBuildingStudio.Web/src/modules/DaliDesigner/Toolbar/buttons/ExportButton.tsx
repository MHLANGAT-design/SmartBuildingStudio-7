import React, { useEffect, useRef, useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { ExportService } from "@/modules/DaliDesigner/services/ExportService";

export function ExportButton() {
  const doc = useAppSelector((s: any) => s.dali.document);
  const floorplanModel = useAppSelector((s: any) => s.dali.floorplan?.model ?? null);

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const run = (fn: () => void) => {
    try {
      fn();
    } catch (err) {
      console.error("[ExportButton] export failed:", err);
    } finally {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        className="tb-btn"
        onClick={() => setOpen((o) => !o)}
        title="Export this DALI network"
        style={{ display: "flex", alignItems: "center", gap: "4px" }}
      >
        <Download size={14} />
        <span className="tb-label">Export</span>
        <ChevronDown size={12} style={{ opacity: 0.7 }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "4px",
            minWidth: "160px",
            background: "#0F1424",
            border: "1px solid #1E293B",
            borderRadius: "6px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            padding: "4px",
            zIndex: 100,
            fontFamily: "monospace",
            fontSize: "11px",
          }}
        >
          <button
            onClick={() => run(() => ExportService.downloadJson(doc))}
            style={menuItemStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(56,189,248,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Export as JSON
          </button>
          <button
            onClick={() => run(() => ExportService.downloadSvg(doc, floorplanModel))}
            style={menuItemStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(56,189,248,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Export as SVG
          </button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  background: "transparent",
  border: "none",
  color: "#E2E8F0",
  padding: "6px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "11px",
};

export default ExportButton;