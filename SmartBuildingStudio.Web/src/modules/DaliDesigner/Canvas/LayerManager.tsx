// src/modules/DaliDesigner/Canvas/LayerManager.tsx
import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectLayerVisibility } from "@/modules/DaliDesigner/store/daliSelectors";
import {
  toggleLayer,
  showAllLayers,
  hideAllLayers,
  type LayerVisibility,
} from "@/modules/DaliDesigner/store/daliSlice";

interface LayerDef {
  key: keyof LayerVisibility;
  label: string;
}

const LAYERS: LayerDef[] = [
  { key: "rooms",        label: "Rooms" },
  { key: "devices",      label: "Devices" },
  { key: "groups",       label: "Groups" },
  { key: "scenes",       label: "Scenes" },
  { key: "lineTopology", label: "Line Topology" },
  { key: "addressMap",   label: "Address Map" },
  { key: "network",      label: "Network" },
  { key: "signalFlow",   label: "Signal Flow" },
  { key: "validation",   label: "Validation" },
];

export function LayerManager() {
  const dispatch = useAppDispatch();
  const visibility = useAppSelector(selectLayerVisibility);
  const [open, setOpen] = React.useState(false);

  const activeCount = LAYERS.filter((l) => visibility[l.key]).length;

  return (
    <div className="dali-layer-manager" style={panelStyle}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={headerStyle}
        aria-expanded={open}
      >
        <span>Layers</span>
        <span style={{ opacity: 0.6, marginLeft: 8 }}>
          {activeCount}/{LAYERS.length}
        </span>
        <span style={{ marginLeft: 8 }}>{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div style={bodyStyle}>
          {LAYERS.map((l) => (
            <label key={l.key} style={rowStyle}>
              <input
                type="checkbox"
                checked={visibility[l.key]}
                onChange={() => dispatch(toggleLayer(l.key))}
              />
              <span>{l.label}</span>
            </label>
          ))}

          <div style={actionsStyle}>
            <button type="button" onClick={() => dispatch(showAllLayers())} style={btnStyle}>
              Show all
            </button>
            <button type="button" onClick={() => dispatch(hideAllLayers())} style={btnStyle}>
              Hide all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: 12,
  left: 12,
  zIndex: 3,
  background: "rgba(20,20,20,0.92)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 6,
  color: "#ddd",
  fontSize: 11,
  fontFamily: "monospace",
  pointerEvents: "auto",
  minWidth: 160,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: "6px 10px",
  background: "transparent",
  border: "none",
  color: "inherit",
  font: "inherit",
  cursor: "pointer",
  textAlign: "left",
};

const bodyStyle: React.CSSProperties = {
  padding: "4px 10px 8px",
  borderTop: "1px solid rgba(255,255,255,0.08)",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "2px 0",
  cursor: "pointer",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  marginTop: 6,
};

const btnStyle: React.CSSProperties = {
  flex: 1,
  padding: "3px 6px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 3,
  color: "inherit",
  font: "inherit",
  cursor: "pointer",
};

export default LayerManager;