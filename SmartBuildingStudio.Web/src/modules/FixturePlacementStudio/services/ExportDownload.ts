// src/modules/FixturePlacementStudio/services/ExportDownload.ts
//
// Trigger a browser file download from an ExportResult. Delegates to
// the shared downloadBlob helper so the DOM-anchor and object-URL
// lifecycle is handled in one place.

import type { ExportResult } from '@/modules/FixturePlacementStudio/services/ExportService';
import { downloadBlob } from '@/Application/downloadBlob';

export function downloadExport(result: ExportResult): void {
  downloadBlob(result.content, result.fileName, result.mimeType);
}

export default downloadExport;