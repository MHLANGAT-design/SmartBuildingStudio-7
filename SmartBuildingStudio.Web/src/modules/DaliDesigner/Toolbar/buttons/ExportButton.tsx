import React from "react";
import { Download } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { ExportService } from "@/modules/DaliDesigner/services/ExportService";

export function ExportButton() {
  const doc = useAppSelector((s: any) => s.dali.document);

  return (
    <button
      className="tb-btn"
      onClick={() => ExportService.downloadJson(doc)}
      title="Export this DALI network as JSON"
    >
      <Download size={14} />
        <span className="tb-label">Export</span>
      </button>
  );
}

export default ExportButton;

