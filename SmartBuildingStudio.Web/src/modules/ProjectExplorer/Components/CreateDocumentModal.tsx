// src/modules/ProjectExplorer/Components/CreateDocumentModal.tsx
// FIXED – imports X from lucide-react

import React, { useState } from "react";
import { X } from "lucide-react"; // ✅ Required import

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (docName: string) => void;
}

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [docName, setDocName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = docName.trim();
    if (trimmed) {
      onCreate(trimmed);
      setDocName("");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#0F1424",
          border: "1px solid #1E293B",
          borderRadius: "12px",
          padding: "24px",
          width: "420px",
          maxWidth: "90%",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ color: "#05FFC4", fontSize: "18px", fontWeight: "bold", fontFamily: "monospace", margin: 0 }}>
              📄 New Engineering Drawing
            </h2>
            <p style={{ color: "#64748B", fontSize: "12px", marginTop: "4px", fontFamily: "monospace" }}>
              Enter a name for the new document.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748B",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: "#94A3B8", fontSize: "11px", fontWeight: "bold", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Document Name
            </label>
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g., Ground Floor Layout"
              autoFocus
              style={{
                width: "100%",
                padding: "10px 14px",
                backgroundColor: "#06080F",
                border: "1px solid #1E293B",
                borderRadius: "8px",
                color: "#E2E8F0",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "monospace",
              }}
              onFocus={(e) => e.target.select()}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 20px",
                backgroundColor: "transparent",
                border: "1px solid #1E293B",
                borderRadius: "6px",
                color: "#94A3B8",
                cursor: "pointer",
                fontSize: "12px",
                fontFamily: "monospace",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1E293B")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!docName.trim()}
              style={{
                padding: "8px 24px",
                backgroundColor: docName.trim() ? "rgba(5, 255, 196, 0.1)" : "rgba(5, 255, 196, 0.03)",
                border: docName.trim() ? "1px solid #05FFC4" : "1px solid #1E293B",
                borderRadius: "6px",
                color: docName.trim() ? "#05FFC4" : "#475569",
                cursor: docName.trim() ? "pointer" : "not-allowed",
                fontSize: "12px",
                fontFamily: "monospace",
                fontWeight: "bold",
                transition: "all 0.15s",
                opacity: docName.trim() ? 1 : 0.5,
              }}
            >
              Create Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDocumentModal;