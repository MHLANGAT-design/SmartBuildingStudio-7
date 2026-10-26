import React, { useState } from "react";
import { FloorPlanApi } from "@/modules/FloorPlanDesigner/Services/FloorPlanApi";
import { ExportFormat } from "@/modules/FloorPlanDesigner/Services/ExportService";

export interface ExportButtonProps {
  api: FloorPlanApi;
  format?: ExportFormat; // Allows parent component to specify 'json' or 'svg' (defaults to JSON)
}

export const ExportButton: React.FC<ExportButtonProps> = ({ api, format = ExportFormat.JSON }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      console.log(`[CAD Data Pipeline]: Generating local file stream payload for format: ${format.toUpperCase()}...`);

      // Execute synchronous export pipeline from API
      const result = api.export(format);

      // Trigger automatic browser file download wrapper
      const blob = new Blob([result.data], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      link.href = url;
      link.download = `floorplan_export.${format}`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up DOM and memory allocation safely
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log("[CAD Data Pipeline]: Client file export download completed successfully.");
    } catch (error) {
      console.error("Failed to export drawing.", error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatLabel = typeof format === "string" ? format.toUpperCase() : "JSON";

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      title={`Export Active Layer Parameters Data Package as ${formatLabel} (📤)`}
      style={{
        padding: "6px 14px",
        cursor: isExporting ? "not-allowed" : "pointer",
        border: "1px solid #1E293B",
        borderRadius: "8px",
        backgroundColor: "rgba(30, 41, 59, 0.6)",
        color: isExporting ? "#475569" : "#E2E8F0",
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
      <span style={{ color: isExporting ? "#475569" : "#38BDF8" }}>📤</span> 
      {isExporting ? "Exporting..." : `Export ${formatLabel}`}
    </button>
  );
};

export default ExportButton;
