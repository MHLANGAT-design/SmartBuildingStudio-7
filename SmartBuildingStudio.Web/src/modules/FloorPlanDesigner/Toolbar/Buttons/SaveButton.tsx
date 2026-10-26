// src/modules/FloorPlanDesigner/Toolbar/Buttons/SaveButton.tsx
// ✅ Refactored to use the new UseDocumentSaver hook

import React, { useState } from "react";
import { UseDocumentSaver } from "@/modules/FloorPlanDesigner/Hooks/UseDocumentSaver";
import { FloorPlanApi } from "@/modules/FloorPlanDesigner/Services/FloorPlanApi";

export interface SaveButtonProps {
  /** @deprecated The hook now reads directly from Redux; this prop is kept for backward compatibility. */
  api?: FloorPlanApi;
  /** Optional override: if provided, this function is called instead of the hook's save. */
  onClick?: () => Promise<void> | void;
}

export const SaveButton: React.FC<SaveButtonProps> = ({ onClick }) => {
  const { saveDocument, isDirty } = UseDocumentSaver();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      // 1. If parent provided an override, use it
      if (typeof onClick === "function") {
        await onClick();
      } else {
        // 2. Otherwise, use the hook's saveDocument (which reads fresh Redux state)
        await saveDocument();
      }
    } catch (error) {
      console.error("[SaveButton] Save failed:", error);
      alert("Save failed. Please check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={isSaving}
      title="Commit Canvas Changes and Save Layout State to Database (💾)"
      style={{
        padding: "6px 14px",
        cursor: isSaving ? "not-allowed" : "pointer",
        border: "1px solid #1E293B",
        borderRadius: "8px",
        backgroundColor: isSaving ? "#0F172A" : "rgba(16, 185, 129, 0.1)",
        color: "#10B981",
        fontSize: "11px",
        fontFamily: "monospace",
        fontWeight: "bold",
        transition: "all 0.15s ease",
        outline: "none",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: isSaving ? "none" : "0 0 10px rgba(16, 185, 129, 0.1)",
      }}
      className="hover:bg-emerald-500/20"
    >
      <span>💾</span> {isSaving ? "Saving..." : isDirty ? "Save*" : "Save"}
    </button>
  );
};

export default SaveButton;