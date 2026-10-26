// src/modules/FloorPlanDesigner/Toolbar/Buttons/SaveAsButton.tsx

import React, { useState } from "react";
import { FloorPlanApi } from "@/modules/FloorPlanDesigner/Services/FloorPlanApi";
import { SaveAsDialog } from "@/modules/FloorPlanDesigner/Dialogs/SaveAsDialog";

export interface SaveAsButtonProps {
  api: FloorPlanApi;
}

export const SaveAsButton: React.FC<SaveAsButtonProps> = ({ api }) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialogPrompt = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("[CAD Data Pipeline]: Initializing schematic naming modal overlay interface layer...");
    setDialogOpen(true);
  };

  // ✅ SAFE: Check if getDocument exists before calling
  const activeDocumentInstance = (api && typeof api.getDocument === 'function') 
    ? api.getDocument() 
    : (window as any).__floorPlanActiveDocumentInstance;

  const standardDefaultPlaceholder = activeDocumentInstance?.name || activeDocumentInstance?.Id || "SBS-Layout-V1-Draft";

  return (
    <>
      <button
        type="button"
        onClick={handleOpenDialogPrompt}
        title="Fork Layout Definition, Fork New Database Schematic Name and Save (📁)"
        style={{
          padding: "6px 14px",
          cursor: "pointer",
          border: "1px solid #1E293B",
          borderRadius: "8px",
          backgroundColor: "rgba(30, 41, 59, 0.6)",
          color: "#E2E8F0",
          fontSize: "11px",
          fontFamily: "monospace",
          fontWeight: "bold",
          transition: "all 0.15s ease",
          outline: "none",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
        }}
        className="hover:bg-slate-700/60"
      >
        <span>📁</span> Save As
      </button>

      <SaveAsDialog 
        isOpen={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        defaultName={standardDefaultPlaceholder}
      />
    </>
  );
};

export default SaveAsButton;