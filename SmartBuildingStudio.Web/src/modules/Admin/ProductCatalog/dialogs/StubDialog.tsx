// src/modules/Admin/ProductCatalog/dialogs/StubDialog.tsx
//
// Placeholder modal shell used during Phase A while the real dialogs
// are built. Renders the standard modal chrome so the admin page can
// wire up the three buttons end-to-end.

import React from "react";

export interface StubDialogProps {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
}

export const StubDialog: React.FC<StubDialogProps> = ({ open, title, description, onClose }) => {
  if (!open) return null;
  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={{ fontWeight: "bold", fontSize: "13px" }}>{title}</span>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>
        <div style={{ padding: "20px", fontSize: "12px", color: "#94A3B8" }}>
          {description}
          <div style={{ marginTop: "16px", padding: "10px", background: "rgba(255,184,0,0.1)", border: "1px solid rgba(255,184,0,0.3)", borderRadius: "4px", color: "#FFB800" }}>
            🚧 Phase A stub — real dialog lands in Phase B/C/D.
          </div>
        </div>
      </div>
    </div>
  );
};

const backdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const dialogStyle: React.CSSProperties = {
  background: "#0F1424",
  border: "1px solid #1E293B",
  borderRadius: "8px",
  minWidth: "480px",
  maxWidth: "90vw",
  fontFamily: "monospace",
  color: "#E2E8F0",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderBottom: "1px solid #1E293B",
};

const closeBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#64748B",
  cursor: "pointer",
  fontSize: "14px",
  padding: "0 4px",
};

export default StubDialog;