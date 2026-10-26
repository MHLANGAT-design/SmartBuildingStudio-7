// src/modules/DaliDesigner/services/ExportService.ts

import { DaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";
import { DaliDocumentSerializer } from "@/modules/DaliDesigner/Document/DaliDocumentSerializer";
import { downloadBlob } from "@/Application/downloadBlob";

export const ExportService = {
  downloadJson(doc: DaliDocument): void {
    const json = JSON.stringify(DaliDocumentSerializer.toDTO(doc), null, 2);
    const safeName =
      (doc.name || "network")
        .replace(/[/\\<>:"|?*\s]+/g, "_")
        .replace(/^[._]+|[._]+$/g, "") || "network";
    downloadBlob(json, `${safeName}.dali.json`, "application/json");
  },
};