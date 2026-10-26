import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";

export enum ExportFormat {
  JSON = "json",
  SVG = "svg",
}

export interface ExportResult {
  format: ExportFormat;
  mimeType: string;
  data: string;
}

export class ExportService {
  /**
   * Exports a drawing document into the targeted file format.
   */
  public static export(document: DrawingDocument, format: ExportFormat): ExportResult {
    switch (format) {
      case ExportFormat.JSON:
        return this.exportJson(document);
      case ExportFormat.SVG:
        return this.exportSvg(document);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private static exportJson(document: DrawingDocument): ExportResult {
    return {
      format: ExportFormat.JSON,
      mimeType: "application/json",
      data: JSON.stringify(document, null, 2),
    };
  }

  private static exportSvg(document: DrawingDocument): ExportResult {
    const walls = document.getWalls();
    const doors = document.getDoors();
    const windows = document.getWindows();

    // Fast bounds calculation to construct a valid SVG viewBox attribute
    let minX = 0, minY = 0, maxX = 800, maxY = 600;
    if (walls.length > 0) {
      minX = Math.min(...walls.flatMap(w => [w.start.x, w.end.x]));
      minY = Math.min(...walls.flatMap(w => [w.start.y, w.end.y]));
      maxX = Math.max(...walls.flatMap(w => [w.start.x, w.end.x]));
      maxY = Math.max(...walls.flatMap(w => [w.start.y, w.end.y]));
      
      // Add padding envelope around vector coordinates
      minX -= 50; minY -= 50; maxX += 50; maxY += 50;
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<!-- W3C SVG namespace reference: http://www.w3.org/2000/svg -->`,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="100%" height="100%">`
    ];

    // Export structural wall paths
    for (const wall of walls) {
      lines.push(`<line x1="${wall.start.x}" y1="${wall.start.y}" x2="${wall.end.x}" y2="${wall.end.y}" stroke="#303030" stroke-width="${wall.thickness || 2}" stroke-linecap="round"/>`);
    }

    // Export layout opening points (Doors)
    for (const door of doors) {
      lines.push(`<circle cx="${door.position.x}" cy="${door.position.y}" r="6" fill="#1976D2" stroke="#0D47A1" stroke-width="1"/>`);
    }

    // Export layout opening regions (Windows)
    for (const window of windows) {
      lines.push(`<rect x="${window.position.x - 7}" y="${window.position.y - 2}" width="14" height="4" fill="#4FC3F7" stroke="#0288D1" stroke-width="1"/>`);
    }

    lines.push("</svg>");

    return {
      format: ExportFormat.SVG,
      mimeType: "image/svg+xml",
      data: lines.join("\n"),
    };
  }
}
