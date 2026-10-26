// src/modules/Shared/Zoom/GlobalZoomControl.tsx
//
// App-level zoom + pan control. Renders a compact cluster of buttons
// in the chrome (typically the bottom-right of AppShell). Calls the
// active module's zoom surface for zoom/fit, and toggles the shared
// pan-mode store for the hand tool.
//
// When no zoomable surface is registered (e.g. on the Dashboard),
// the control renders nothing — it's contextual to designer modules.
//
// Color convention:
//   −  zoom out  → sky   (#38BDF8)
//   +  zoom in   → cyan  (#05FFC4)  [app primary accent]
//   ⛶  fit       → green (#4ADE80)
//   ✋  pan mode  → violet (#A78BFA), highlighted when active
//   %  reset     → neutral text

import React, { useEffect, useState } from "react";
import { Minus, Plus, Maximize2, Hand } from "lucide-react";
import { useActiveZoomSurface } from "./zoomRegistry";
import { usePanMode, togglePanMode } from "./panMode";

const hexToRgba = (hex: string, alpha: number): string => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const COLOR_ZOOM_OUT = "#38BDF8"; // sky
const COLOR_ZOOM_IN  = "#05FFC4"; // cyan
const COLOR_FIT      = "#4ADE80"; // green
const COLOR_PAN      = "#A78BFA"; // violet

export const GlobalZoomControl: React.FC = () => {
  const surface = useActiveZoomSurface();
  const panMode = usePanMode();
  const [zoom, setZoom] = useState<number>(1);

  useEffect(() => {
    if (!surface) return;
    let raf = 0;
    const tick = () => {
      setZoom(surface.getZoom());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [surface]);

  if (!surface) return null;

  const pct = Math.round(zoom * 100);

  const btn = (
    onClick: () => void,
    label: string,
    color: string,
    children: React.ReactNode,
    active = false
  ) => (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={active || undefined}
      style={{
        width: 28,
        height: 28,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? hexToRgba(color, 0.22) : "transparent",
        border: "none",
        borderRadius: 4,
        color,
        cursor: "pointer",
        transition: "background 0.12s, color 0.12s",
      }}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.background = hexToRgba(color, 0.18);
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      role="group"
      aria-label="Zoom controls"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        padding: "2px 4px",
        background: "#090D16",
        border: "1px solid #1E293B",
        borderRadius: 8,
        fontFamily: "monospace",
      }}
    >
      {btn(
        () => surface.zoomOut(),
        `Zoom out (${surface.moduleName})`,
        COLOR_ZOOM_OUT,
        <Minus size={13} />
      )}

      <button
        type="button"
        onClick={() => surface.setZoom(1)}
        title="Reset zoom to 100%"
        style={{
          minWidth: 46,
          padding: "4px 6px",
          background: "transparent",
          border: "none",
          color: "#E2E8F0",
          fontFamily: "monospace",
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          textAlign: "center",
          borderRadius: 4,
          transition: "background 0.12s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(226,232,240,0.10)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {pct}%
      </button>

      {btn(
        () => surface.zoomIn(),
        `Zoom in (${surface.moduleName})`,
        COLOR_ZOOM_IN,
        <Plus size={13} />
      )}

      <div style={{ width: 1, height: 18, background: "#1E293B", margin: "0 2px" }} />

      {btn(
        () => surface.fitToContent(),
        `Fit to content (${surface.moduleName})`,
        COLOR_FIT,
        <Maximize2 size={13} />
      )}

      {btn(
        () => togglePanMode(),
        panMode ? "Pan mode active — click to disable" : "Pan mode (left-drag to pan)",
        COLOR_PAN,
        <Hand size={13} />,
        panMode
      )}
    </div>
  );
};

export default GlobalZoomControl;