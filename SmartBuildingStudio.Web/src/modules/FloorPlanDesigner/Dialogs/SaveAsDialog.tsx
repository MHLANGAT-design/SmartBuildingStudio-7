import React, { useState, useEffect } from "react";
import { useAppDispatch } from "@/Application/ConfigureStore";
import * as FloorPlanThunks from "@/modules/FloorPlanDesigner/Store/FloorPlanThunks";

interface SaveAsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultName?: string;
}

export function SaveAsDialog({ isOpen, onClose, defaultName = "" }: SaveAsDialogProps) {
  const dispatch = useAppDispatch();
  const [newName, setNewName] = useState(defaultName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewName(defaultName);
      setIsSubmitting(false);
    }
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      console.log(`[CAD History Engine]: Dispatching asynchronous schematic fork payload: ${newName.trim()}`);
      
      let targetedThunkAction: any = null;
      const thunkBundle = FloorPlanThunks as any;

      if (typeof thunkBundle.saveDrawingAs === "function") {
        targetedThunkAction = thunkBundle.saveDrawingAs;
      } else if (typeof thunkBundle.saveDocumentAs === "function") {
        targetedThunkAction = thunkBundle.saveDocumentAs;
      } else if (typeof thunkBundle.forkDrawing === "function") {
        targetedThunkAction = thunkBundle.forkDrawing;
      } else if (typeof thunkBundle.saveAs === "function") {
        targetedThunkAction = thunkBundle.saveAs;
      } else {
        const matchingKey = Object.keys(thunkBundle).find(
          key => (key.toLowerCase().includes("save") || key.toLowerCase().includes("fork")) && key.toLowerCase().includes("as")
        );
        if (matchingKey) {
          targetedThunkAction = thunkBundle[matchingKey];
        }
      }

      if (targetedThunkAction) {
        await dispatch(targetedThunkAction({ newName: newName.trim() })).unwrap();
      } else {
        (window as any).__floorPlanActiveDocumentInstanceName = newName.trim();
        window.dispatchEvent(new CustomEvent("sbs:document-renamed", { detail: { name: newName.trim() } }));
      }

      window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
      window.dispatchEvent(new CustomEvent("canvas-invalidate"));
      
      onClose();
    } catch (err) {
      console.error("Failed to fork active project blueprint blueprint file mapping:", err);
      setIsSubmitting(false);
    }
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
        backdropFilter: "blur(8px)",
        userSelect: "none",
        padding: "20px",
        boxSizing: "border-box"
      }}
    >
      <div 
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "#0B0F19",
          border: "1px solid #1E293B",
          borderRadius: "12px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 210, 255, 0.03)",
          overflow: "hidden",
          fontFamily: "monospace",
          color: "#E2E8F0"
        }}
      >
        {/* MODAL HEADER BLOCK */}
        <div 
          style={{
            padding: "14px 20px",
            backgroundColor: "#0F1424",
            borderBottom: "1px solid #1E293B",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#00D2FF", fontSize: "14px" }}>💾</span>
            <h3 style={{ margin: 0, fontSize: "11px", fontWeight: "bold", tracking: "0.05em", color: "#00D2FF", textTransform: "uppercase" }}>
              Fork Layout // Save As
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            style={{
              background: "transparent",
              border: "none",
              color: "#64748B",
              cursor: "pointer",
              fontSize: "14px",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              transition: "color 0.15s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FF4B5C")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
          >
            ✕
          </button>
        </div>

        {/* INPUT FORM DECK */}
        <form onSubmit={handleSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", margin: 0 }}>
          
          {/* SYSTEM NETWORK TELEMETRY STATUS FLAG */}
          <div style={{ background: "rgba(30, 41, 59, 0.3)", border: "1px dashed rgba(30, 41, 59, 0.8)", padding: "10px 12px", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "9px", color: "#64748B", textTransform: "uppercase" }}>Target Object Stream Address //</div>
            <div style={{ fontSize: "10px", color: "#E2E8F0", wordBreak: "break-all", fontWeight: "bold" }}>
              📂 SBS.Web_Node:49235 / schema_pool
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "10px", fontWeight: "bold", color: "#64748B", textTransform: "uppercase", tracking: "0.03em" }}>
              New Schematic Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., SBS-Layout-V2-Refined"
              style={{
                width: "100%",
                backgroundColor: "#06080F",
                border: "1px solid #1E293B",
                borderRadius: "6px",
                padding: "10px 12px",
                fontSize: "12px",
                color: "#05FFC4", // Electric cyan font mapping matching system status colors
                outline: "none",
                fontFamily: "monospace",
                boxSizing: "border-box",
                transition: "all 0.15s ease",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)"
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = "1px solid #00D2FF";
                e.currentTarget.style.boxShadow = "0 0 10px rgba(0, 210, 255, 0.1), inset 0 2px 4px rgba(0,0,0,0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = "1px solid #1E293B";
                e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.3)";
              }}
              required
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {/* ACTION BUTTON ROW CONTROLS */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "14px", borderTop: "1px solid rgba(30, 41, 59, 0.4)" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: "8px 16px",
                backgroundColor: "rgba(30, 41, 59, 0.4)",
                border: "1px solid #1E293B",
                borderRadius: "6px",
                color: "#94A3B8",
                fontSize: "11px",
                fontWeight: "bold",
                fontFamily: "monospace",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                outline: "none"
              }}
              onMouseEnter={(e) => { if(!isSubmitting) e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.8)"; }}
              onMouseLeave={(e) => { if(!isSubmitting) e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.4)"; }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={!newName.trim() || isSubmitting}
              style={{
                padding: "8px 16px",
                backgroundColor: !newName.trim() || isSubmitting ? "#0F1424" : "rgba(0, 210, 255, 0.15)",
                border: "1px solid #1E293B",
                borderRadius: "6px",
                color: !newName.trim() || isSubmitting ? "#475569" : "#00D2FF",
                fontSize: "11px",
                fontWeight: "bold",
                fontFamily: "monospace",
                cursor: !newName.trim() || isSubmitting ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                outline: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: !newName.trim() || isSubmitting ? "none" : "0 0 12px rgba(0, 210, 255, 0.15)"
              }}
              onMouseEnter={(e) => { if(newName.trim() && !isSubmitting) e.currentTarget.style.backgroundColor = "rgba(0, 210, 255, 0.25)"; }}
              onMouseLeave={(e) => { if(newName.trim() && !isSubmitting) e.currentTarget.style.backgroundColor = "rgba(0, 210, 255, 0.15)"; }}
            >
              <span>{isSubmitting ? "🔄" : "⚡"}</span>
              {isSubmitting ? "Forkeling..." : "Commit Fork"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default SaveAsDialog;
