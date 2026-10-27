// src/modules/FloorPlanDesigner/Toolbar/Buttons/ExportButton.tsx
//
// One button + format dropdown. Exports the active DrawingDocument as
// either SVG (architectural plan, visual) or JSON (data projection).
//
// The DrawingDocument instance lives on window.__floorPlanActiveDocumentInstance
// (set by FloorPlanDesigner). ExportService.export reads its getElements()
// and getWalls()/getDoors()/getWindows()/getRooms() accessors.
//
// Defaults:
//   - format: SVG (what a user expects from "Export")
//   - JSON shape: Compact (~500 KB) — switch via options.jsonShape
//   - SVG raw geometry: excluded (architectural only)

import React, { useState } from "react";
import { FloorPlanApi } from "@/modules/FloorPlanDesigner/Services/FloorPlanApi";
import {
  ExportService,
  ExportFormat,
  ExportOptions,
  JsonExportShape,
} from "@/modules/FloorPlanDesigner/Services/ExportService";

export interface ExportButtonProps {
  api: FloorPlanApi;
  /** Initial format shown in the dropdown. Defaults to SVG. */
  defaultFormat?: ExportFormat;
  /** Passed through to ExportService.export. Defaults to compact JSON + no raw geometry. */
  options?: ExportOptions;
}

const DEFAULT_OPTIONS: ExportOptions = {
  jsonShape: JsonExportShape.Compact,
  includeRawGeometry: false,
  includeRoomLabels: true,
};

export const ExportButton: React.FC<ExportButtonProps> = ({
  api: _api, // kept for interface compatibility; not used for the export path
  defaultFormat = ExportFormat.SVG,
  options = DEFAULT_OPTIONS,
}) => {
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      console.log(
        `[CAD Data Pipeline]: Generating local file stream payload for format: ${format.toUpperCase()}...`
      );

      // DrawingDocument instance (set by FloorPlanDesigner on load).
      const doc = (window as any).__floorPlanActiveDocumentInstance;
      if (!doc) {
        throw new Error(
          "No active drawing document. Load a floor plan before exporting."
        );
      }
      if (typeof doc.getElements !== "function") {
        throw new Error(
          "Active document is not a DrawingDocument instance (missing getElements)."
        );
      }

      // Sync export through ExportService.
      const result = ExportService.export(doc, format, options);

      // Trigger a browser download.
      const blob = new Blob([result.data], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `floorplan_export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(
        `[CAD Data Pipeline]: Client file export download completed (${result.data.length} bytes).`
      );
    } catch (error) {
      console.error("Failed to export drawing.", error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatLabel = String(format).toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as ExportFormat)}
        disabled={isExporting}
        aria-label="Export format"
        title="Choose export format"
        style={{
          background: "rgba(30, 41, 59, 0.6)",
          color: isExporting ? "#475569" : "#E2E8F0",
          border: "1px solid #1E293B",
          borderRadius: "6px",
          padding: "5px 8px",
          fontFamily: "monospace",
          fontSize: "11px",
          fontWeight: "bold",
          cursor: isExporting ? "not-allowed" : "pointer",
          outline: "none",
        }}
      >
        <option value={ExportFormat.SVG}>SVG</option>
        <option value={ExportFormat.JSON}>JSON</option>
      </select>

      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        title={`Export active floor plan as ${formatLabel} (📤)`}
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
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
        className="hover:bg-slate-700/60"
      >
        <span style={{ color: isExporting ? "#475569" : "#38BDF8" }}>📤</span>
        {isExporting ? "Exporting..." : `Export ${formatLabel}`}
      </button>
    </div>
  );
};

export default ExportButton;