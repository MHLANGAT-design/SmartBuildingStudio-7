import React from "react";
import { DocumentManager } from "@/modules/FloorPlanDesigner/Document/DocumentManager";

export interface RedoButtonProps {
  documentManager: DocumentManager;
}

export const RedoButton: React.FC<RedoButtonProps> = ({ documentManager }) => {
  const canRedo = documentManager && typeof documentManager.canRedo === "function" 
    ? documentManager.canRedo() 
    : false;

  const handleRedo = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!canRedo || !documentManager) return;

    try {
      console.log("[CAD History Engine]: Re-applying previously rolled back command segment...");
      documentManager.redo();
      
      // 🚀 FIXED: Force the drawing canvas context to immediately paint frames over the updated arrays!
      window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
      window.dispatchEvent(new CustomEvent("canvas-invalidate"));
    } catch (err) {
      console.error("Failed to execute historical redo forward step:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRedo}
      disabled={!canRedo}
      title="Re-apply Bypassed Drafting Command Vector Segment (↪️)"
      style={{
        padding: "6px 14px",
        cursor: canRedo ? "pointer" : "not-allowed",
        border: "1px solid #1E293B",
        borderRadius: "8px",
        backgroundColor: "rgba(30, 41, 59, 0.6)",
        color: canRedo ? "#34D399" : "#475569", // Vivid active progression emerald green
        opacity: canRedo ? 1 : 0.4,
        fontSize: "11px",
        fontFamily: "monospace",
        fontWeight: "bold",
        transition: "all 0.15s ease",
        outline: "none",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: canRedo ? "0 2px 8px rgba(0,0,0,0.15)" : "none"
      }}
    >
      <span style={{ color: canRedo ? "#34D399" : "#475569" }}>↪️</span> Redo
    </button>
  );
};

export default RedoButton;
