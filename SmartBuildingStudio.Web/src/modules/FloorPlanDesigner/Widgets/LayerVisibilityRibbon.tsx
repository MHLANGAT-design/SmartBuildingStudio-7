import React, { useState } from "react";

export const LayerVisibilityRibbon: React.FC = () => {
  // 🚀 FIXED: Aligned state IDs with the exact keys used inside LayerManager constructor seeds!
  const [layers, setLayers] = useState([
    { id: "grid-layer", name: "Reference Grid", visible: true, color: "#00D2FF" },
    { id: "structural-layer", name: "Structural Boundaries", visible: true, color: "#FFB800" },
    { id: "fixture-layer", name: "DALI Fixture Nodes", visible: true, color: "#05FFC4" }
  ]);

  const handleToggleLayer = (id: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id !== id) return l;
      
      const nextState = !l.visible;
      // Emit the aligned ID string straight to the DrawingCanvas event interceptors
      const ev = new CustomEvent("sbs:layer-toggle", { detail: { id, visible: nextState } });
      window.dispatchEvent(ev);
      
      return { ...l, visible: nextState };
    }));
  };

  return (
    <div style={{ background: "rgba(11, 15, 25, 0.4)", border: "1px solid #1E293B", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px", boxSizing: "border-box", width: "100%" }}>
      <div style={{ fontSize: "9px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Isolate Canvas Planes</div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {layers.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => handleToggleLayer(l.id)}
            style={{ background: l.visible ? "rgba(30, 41, 59, 0.6)" : "#090D16", border: `1px solid ${l.visible ? l.color : "#1E293B"}`, color: l.visible ? "#FFF" : "#475569", padding: "6px 12px", borderRadius: "6px", fontSize: "10px", fontFamily: "monospace", fontWeight: "bold", cursor: "pointer", transition: "all 0.15s ease", outline: "none", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: l.visible ? l.color : "#475569", boxShadow: l.visible ? `0 0 6px ${l.color}` : "none" }} />
            {l.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LayerVisibilityRibbon;
