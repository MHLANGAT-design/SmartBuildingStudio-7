import React, { useState, useEffect } from "react";

interface AddRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; type: string; lux: number }) => void;
  defaultRoomNumber?: number;
}

export function AddRoomDialog({ isOpen, onClose, onSubmit, defaultRoomNumber = 1 }: AddRoomDialogProps) {
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("office");
  const [targetLux, setTargetLux] = useState(500);

  useEffect(() => {
    if (isOpen) {
      setRoomName(`Office Room ${defaultRoomNumber}`);
      setRoomType("office");
      setTargetLux(500);
    }
  }, [isOpen, defaultRoomNumber]);

  if (!isOpen) return null;

  const handleSubmitAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    
    onSubmit({
      name: roomName.trim(),
      type: roomType,
      lux: Number(targetLux)
    });
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
            <span style={{ color: "#05FFC4" }}>📐</span>
            <h3 style={{ margin: 0, fontSize: "11px", fontWeight: "bold", tracking: "0.05em", color: "#05FFC4", textTransform: "uppercase" }}>
              Initialize Room Parameters // Command allocation
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", color: "#64748B", cursor: "pointer", fontSize: "14px" }}>✕</button>
        </div>

        {/* INPUT DECK */}
        <form onSubmit={handleSubmitAction} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", margin: 0 }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "10px", color: "#64748B", textTransform: "uppercase" }}>Room Designation Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              style={{ width: "100%", backgroundColor: "#06080F", border: "1px solid #1E293B", borderRadius: "6px", padding: "8px 12px", fontSize: "12px", color: "#05FFC4", outline: "none", boxSizing: "border-box" }}
              required
              autoFocus
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "10px", color: "#64748B", textTransform: "uppercase" }}>Functional Space Profile</label>
            <select
              value={roomType}
              onChange={(e) => {
                setRoomType(e.target.value);
                if (e.target.value === "corridor") setTargetLux(150);
                else if (e.target.value === "plant") setTargetLux(200);
                else setTargetLux(500);
              }}
              style={{ width: "100%", backgroundColor: "#06080F", border: "1px solid #1E293B", borderRadius: "6px", padding: "8px 12px", fontSize: "12px", color: "#E2E8F0", outline: "none", boxSizing: "border-box", cursor: "pointer" }}
            >
              <option value="office">Standard Office Deck (500 lx)</option>
              <option value="conference">Conference / Boardroom (500 lx)</option>
              <option value="corridor">Corridor / Common Access (150 lx)</option>
              <option value="plant">Switchroom / Plant Facility (200 lx)</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "10px", color: "#64748B", textTransform: "uppercase" }}>Target Illuminance Level (Lux)</label>
            <input
              type="number"
              value={targetLux}
              onChange={(e) => setTargetLux(Number(e.target.value))}
              min={50}
              max={2000}
              style={{ width: "100%", backgroundColor: "#06080F", border: "1px solid #1E293B", borderRadius: "6px", padding: "8px 12px", fontSize: "12px", color: "#E2E8F0", outline: "none", boxSizing: "border-box" }}
              required
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
              style={{ padding: "8px 16px", backgroundColor: "rgba(5, 255, 196, 0.15)", border: "1px solid #1E293B", borderRadius: "6px", color: "#05FFC4", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 0 12px rgba(5, 255, 196, 0.15)" }}
            >
              <span>⚡</span> Commit Parameters
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default AddRoomDialog;
