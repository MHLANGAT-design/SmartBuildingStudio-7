import React, { useState, useEffect } from "react";

interface AddWindowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customName: string) => void;
  defaultWindowNumber?: number;
}

export function AddWindowDialog({ isOpen, onClose, onSubmit, defaultWindowNumber = 1 }: AddWindowDialogProps) {
  const [windowName, setRoomName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setRoomName(`WINDOW_${defaultWindowNumber}`);
    }
  }, [isOpen, defaultWindowNumber]);

  if (!isOpen) return null;

  const handleSubmitAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!windowName.trim()) return;
    
    onSubmit(windowName.trim());
  };

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(8, 10, 19, 0.8)",
        backdropFilter: "blur(6px)",
        userSelect: "none",
        padding: "20px",
        boxSizing: "border-box"
      }}
    >
      <div 
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#0B0F19",
          border: "1px solid #1E293B",
          borderRadius: "12px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          fontFamily: "monospace",
          color: "#E2E8F0"
        }}
      >
        {/* PANEL HEADER */}
        <div style={{ padding: "14px 20px", backgroundColor: "#0F1424", borderBottom: "1px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#38BDF8" }}>🖼️</span>
            <h3 style={{ margin: 0, fontSize: "11px", fontWeight: "bold", letterSpacing: "0.05em", color: "#38BDF8", textTransform: "uppercase" }}>
              Initialize Window Parameters // Command allocation
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", color: "#64748B", cursor: "pointer", fontSize: "14px" }}>✕</button>
        </div>

        {/* INPUT DECK */}
        <form onSubmit={handleSubmitAction} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", margin: 0 }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "10px", color: "#64748B", textTransform: "uppercase" }}>Window Designation Mark ID</label>
            <input
              type="text"
              value={windowName}
              onChange={(e) => setRoomName(e.target.value)}
              style={{ width: "100%", backgroundColor: "#06080F", border: "1px solid #1E293B", borderRadius: "6px", padding: "8px 12px", fontSize: "12px", color: "#38BDF8", outline: "none", boxSizing: "border-box" }}
              required
              autoFocus
            />
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "14px", borderTop: "1px solid rgba(30, 41, 59, 0.4)" }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "8px 16px", backgroundColor: "rgba(30, 41, 59, 0.4)", border: "1px solid #1E293B", borderRadius: "6px", color: "#94A3B8", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: "8px 16px", backgroundColor: "rgba(56, 189, 248, 0.15)", border: "1px solid #38BDF8", borderRadius: "6px", color: "#38BDF8", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 0 12px rgba(56, 189, 248, 0.15)" }}
            >
              <span>⚡</span> Commit Parameters
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default AddWindowDialog;
