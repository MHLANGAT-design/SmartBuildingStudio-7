import React from "react";
import { DocumentManager } from "@/modules/FloorPlanDesigner/Document/DocumentManager";

export interface UndoButtonProps {
  documentManager: DocumentManager;
}

export const UndoButton: React.FC<UndoButtonProps> = ({ documentManager }) => {
  // Safe short-circuit validation check ensures your hooks remain robust if uninstantiated
  const canUndo = documentManager && typeof documentManager.canUndo === "function" 
    ? documentManager.canUndo() 
    : false;

  const handleUndo = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!canUndo || !documentManager) return;

    try {
      console.log("[CAD History Engine]: Reverting previous drafting command vector segment...");
      documentManager.undo();
      
      // 🚀 FIXED: Force the drawing canvas context to immediately paint frames over the updated arrays!
      window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
      window.dispatchEvent(new CustomEvent("canvas-invalidate"));
    } catch (err) {
      console.error("Failed to execute historical undo rollback step:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleUndo}
      disabled={!canUndo}
      title="Rollback Previous Drafting Command Vector Segment (↩️)"
      style={{
        padding: "6px 14px",
        cursor: canUndo ? "pointer" : "not-allowed",
        border: "1px solid #1E293B",
        borderRadius: "8px",
        backgroundColor: "rgba(30, 41, 59, 0.6)",
        color: canUndo ? "#F59E0B" : "#475569", // Vivid warning amber when active
        opacity: canUndo ? 1 : 0.4,
        fontSize: "11px",
        fontFamily: "monospace",
        fontWeight: "bold",
        transition: "all 0.15s ease",
        outline: "none",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: canUndo ? "0 2px 8px rgba(0,0,0,0.15)" : "none"
      }}
    >
      <span style={{ color: canUndo ? "#F59E0B" : "#475569" }}>↩️</span> Undo
    </button>
  );
};

export default UndoButton;
