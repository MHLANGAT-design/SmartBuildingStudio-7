// src/modules/FloorPlanDesigner/Services/ExportService.ts

import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";

export enum ExportFormat {
  JSON = "json",
  SVG = "svg",
}

export enum JsonExportShape {
  Full = "full",
  Compact = "compact",
}

export interface ExportResult {
  format: ExportFormat;
  mimeType: string;
  data: string;
}

export interface ExportOptions {
  jsonShape?: JsonExportShape;
  includeRawGeometry?: boolean;
  includeRoomLabels?: boolean;
}

interface Point { x: number; y: number; }

interface Primitive {
  kind?: string;
  points?: Point[];
  center?: Point;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
}

function escapeXml(s: string): string {
  return String(s).replace(/[<>&"']/g, (c) => {
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    if (c === "&") return "&amp;";
    if (c === '"') return "&quot;";
    return "&apos;";
  });
}

function getBounds(el: any): Point[] {
  const pts: Point[] = [];
  const addPt = (p: any) => {
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
      pts.push({ x: p.x, y: p.y });
    }
  };

  if (Array.isArray(el.points)) for (const p of el.points) addPt(p);
  if (Array.isArray(el.vertices)) for (const p of el.vertices) addPt(p);
  if (el.start) addPt(el.start);
  if (el.end) addPt(el.end);
  if (Array.isArray(el.primitives)) {
    for (const prim of el.primitives) {
      if (Array.isArray(prim.points)) for (const p of prim.points) addPt(p);
      if (prim.center) addPt(prim.center);
    }
  }
  return pts;
}

function classifyElement(el: any): "room" | "wall" | "door" | "window" | "raw" | "fixture" | "other" {
  if (!el) return "other";
  
  const type = String(el.type || "").toLowerCase();
  const layer = String(el.layer || el.originalLayer || "").toLowerCase();

  // 1. Raw geometry is checked FIRST so it never falls into the wall bucket
  if (type === "rawgeometry" || layer === "rawgeometry" || layer === "raw") {
    return "raw";
  }

  // 2. Semantic types
  if (type === "room" || type === "rooms" || el.isRoom === true) return "room";
  if (type.includes("door") || layer.includes("door") || layer === "dr") return "door";
  if (type.includes("window") || layer.includes("window") || layer.includes("glaz") || layer === "wd") return "window";
  
  // 3. Walls
  const normalizedType = type.replace(/[_\s-]/g, "");
  if (
    type === "wall" || 
    type === "walls" || 
    normalizedType === "polyline" || 
    layer.includes("wall") || 
    el.thickness !== undefined
  ) {
    return "wall";
  }

  // 4. Fixtures
  if (type === "fixture" || normalizedType === "luminaire" || el.isFixture === true) return "fixture";
  
  return "other";
}

export class ExportService {
  public static export(
    document: DrawingDocument,
    format: ExportFormat,
    options: ExportOptions = {}
  ): ExportResult {
    if (format === ExportFormat.JSON) {
      return this.exportJson(document, options);
    }
    return this.exportSvg(document, options);
  }

  private static exportJson(
    document: DrawingDocument,
    options: ExportOptions
  ): ExportResult {
    const shape = options.jsonShape ?? JsonExportShape.Full;

    if (shape === JsonExportShape.Compact) {
      const payload = {
        metadata: document.getMetadata(),
        walls: document.getWalls(),
        doors: document.getDoors(),
        windows: document.getWindows(),
        rooms: document.getRooms(),
      };
      return {
        format: ExportFormat.JSON,
        mimeType: "application/json",
        data: JSON.stringify(payload, null, 2),
      };
    }

    const payload = {
      metadata: document.getMetadata(),
      elements: document.getElements(),
    };
    return {
      format: ExportFormat.JSON,
      mimeType: "application/json",
      data: JSON.stringify(payload, null, 2),
    };
  }

  private static exportSvg(
    document: DrawingDocument,
    options: ExportOptions
  ): ExportResult {
    const includeRawGeometry = options.includeRawGeometry ?? true;
    const includeRoomLabels = options.includeRoomLabels ?? true;
    const elements = document.getElements();

    const validElements: Array<{ el: any; kind: string }> = [];

    // ── 1. Compute bounds ───────────────────────────────────────────
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const includePt = (p: Point) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    };

    for (const el of elements) {
      const kind = classifyElement(el);
      if (kind === "other" || (kind === "raw" && !includeRawGeometry)) continue;

      const pts = getBounds(el);
      if (kind === "room" && pts.length < 3) continue;
      if (kind !== "room" && pts.length < 2 && kind !== "fixture") continue;

      for (const p of pts) includePt(p);
      validElements.push({ el, kind });
    }

    const hasAnyGeometry = Number.isFinite(minX);
    if (!hasAnyGeometry) { minX = 0; minY = 0; maxX = 800; maxY = 600; }

    const pad = hasAnyGeometry ? Math.max(400, (maxX - minX) * 0.03) : 20;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    const width  = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);

    // ── 2. Output pixel dimensions ──────────────────────────────────
    const aspect = width / height;
    const TARGET_LONG_EDGE = 1800;
    const outW = aspect >= 1 ? TARGET_LONG_EDGE : Math.round(TARGET_LONG_EDGE * aspect);
    const outH = aspect >= 1 ? Math.round(TARGET_LONG_EDGE / aspect) : TARGET_LONG_EDGE;

    const worldPerPx = width / outW;
    const px = (n: number) => n * worldPerPx;

    const projectY = (y: number) => maxY - y;
    const projX = (x: number) => x - minX;

    const out: string[] = [];
    out.push('<?xml version="1.0" encoding="UTF-8"?>');
    out.push(
      `<svg xmlns="http://www.w3.org/2000/svg" ` +
      `viewBox="0 0 ${width} ${height}" ` +
      `width="${outW}" height="${outH}" ` +
      `preserveAspectRatio="xMidYMid meet">`
    );
    out.push(`  <rect width="${width}" height="${height}" fill="#0A0A0A"/>`);

    // ── 3. Floorplan ────────────────────────────────────────────────
    
    // 3a. Raw Geometry
    out.push('    <g id="rawgeometry" fill="none" stroke="#94A3B8" stroke-linejoin="round" stroke-linecap="round">');
    for (const { el, kind } of validElements) {
      if (kind !== "raw") continue;
      const pts = getBounds(el);
      if (pts.length < 2) continue;
      const d = pts.map(p => `${projX(p.x)},${projectY(p.y)}`).join(" ");
      out.push(`      <polyline points="${d}" stroke-width="${px(0.75)}"/>`);
    }
    out.push('    </g>');

    // 3b. Rooms
    out.push('    <g id="rooms">');
    for (const { el, kind } of validElements) {
      if (kind !== "room") continue;
      const pts = getBounds(el);
      if (pts.length < 3) continue;

      const d = pts.map(p => `${projX(p.x)},${projectY(p.y)}`).join(" ");
      const fill = typeof el.fillStyle === "string" ? el.fillStyle : "rgba(74, 222, 128, 0.12)";
      const stroke = typeof el.strokeStyle === "string" ? el.strokeStyle : "#4ADE80";
      
      out.push(`      <polygon points="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${px(1.5)}" stroke-linejoin="round"/>`);
      
      if (includeRoomLabels && el.name) {
        let cx = 0, cy = 0;
        for (const p of pts) { cx += p.x; cy += p.y; }
        cx /= pts.length;
        cy /= pts.length;
        out.push(
          `      <text x="${projX(cx)}" y="${projectY(cy)}" text-anchor="middle" dominant-baseline="middle" ` +
          `font-family="sans-serif" font-size="${px(11)}" font-weight="700" ` +
          `fill="#4ADE80" opacity="0.9">${escapeXml(String(el.name))}</text>`
        );
      }
    }
    out.push('    </g>');

    // 3c. Walls, Doors, Windows
    out.push('    <g id="structures" fill="none" stroke-linejoin="round" stroke-linecap="round">');
    for (const { el, kind } of validElements) {
      if (kind === "room" || kind === "raw" || kind === "fixture") continue;

      let stroke = "#9CA3AF";
      let sw = px(2);

      if (kind === "wall") {
        stroke = "#9CA3AF";
        sw = px(2.5);
      } else if (kind === "door") {
        stroke = "#EAB308";
        sw = px(3);
      } else if (kind === "window") {
        stroke = "#4FC3F7";
        sw = px(3.5);
      }

      if (Array.isArray(el.primitives) && el.primitives.length > 0) {
        for (const prim of el.primitives as Primitive[]) {
          if (prim.kind === "line" && prim.points && prim.points.length >= 2) {
            const a = prim.points[0];
            const b = prim.points[1];
            out.push(`      <line x1="${projX(a.x)}" y1="${projectY(a.y)}" x2="${projX(b.x)}" y2="${projectY(b.y)}" stroke="${stroke}" stroke-width="${sw}"/>`);
          } else if (prim.kind === "arc" && prim.center) {
            const { center, radius, startAngle, endAngle } = prim;
            if (radius && startAngle !== undefined && endAngle !== undefined) {
              const sx = center.x + radius * Math.cos(startAngle);
              const sy = center.y + radius * Math.sin(startAngle);
              const ex = center.x + radius * Math.cos(endAngle);
              const ey = center.y + radius * Math.sin(endAngle);
              
              let angleDiff = endAngle - startAngle;
              while (angleDiff < 0) angleDiff += 2 * Math.PI;
              while (angleDiff >= 2 * Math.PI) angleDiff -= 2 * Math.PI;
              const largeArc = angleDiff > Math.PI ? 1 : 0;
              const sweep = 0;

              out.push(`      <path d="M ${projX(sx)} ${projectY(sy)} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${projX(ex)} ${projectY(ey)}" stroke="${stroke}" stroke-width="${sw}"/>`);
            }
          } else if (prim.points) {
            const d = prim.points.map((p: Point) => `${projX(p.x)},${projectY(p.y)}`).join(" ");
            out.push(`      <polyline points="${d}" stroke="${stroke}" stroke-width="${sw}"/>`);
          }
        }
      } else {
        const pts = getBounds(el);
        if (pts.length >= 2) {
          const d = pts.map(p => `${projX(p.x)},${projectY(p.y)}`).join(" ");
          out.push(`      <polyline points="${d}" stroke="${stroke}" stroke-width="${sw}"/>`);
        }
      }
    }
    out.push('    </g>');

    // 3d. Fixtures
    out.push('    <g id="fixtures">');
    for (const { el, kind } of validElements) {
      if (kind !== "fixture") continue;
      const pts = getBounds(el);
      if (pts.length === 0) continue;
      
      const pt = pts[0];
      const r = px(5);
      
      const rawKind = String(el.kind ?? el.fixtureType ?? el.sourceKind ?? "").toLowerCase().replace(/[_\s-]/g, "");
      
      let fill = "#94A3B8";
      let stroke = "#64748B";
      let glyph = "";

      if (rawKind.includes("luminaire") || rawKind === "light" || rawKind === "downlight" || rawKind === "ledpanel") {
        fill = "#FACC15";
        stroke = "#854D0E";
        glyph = "L";
      } else if (rawKind.includes("emergency")) {
        fill = "#EF4444";
        stroke = "#7F1D1D";
        glyph = "E";
      } else if (rawKind.includes("sensor") || rawKind.includes("presence") || rawKind.includes("occupancy") || rawKind.includes("motion")) {
        fill = "#FB923C";
        stroke = "#7C2D12";
        glyph = "S";
      } else if (rawKind.includes("switch") || rawKind === "wallswitch") {
        fill = "#22D3EE";
        stroke = "#0E7490";
        glyph = "W";
      } else if (rawKind.includes("gateway")) {
        fill = "#A855F7";
        stroke = "#581C87";
        glyph = "G";
      } else if (rawKind.includes("controller") || rawKind.includes("powersupply") || rawKind.includes("driver")) {
        fill = "#34D399";
        stroke = "#065F46";
        glyph = "C";
      }
      
      out.push(
        `      <circle cx="${projX(pt.x)}" cy="${projectY(pt.y)}" r="${r}" ` +
        `fill="${fill}" stroke="${stroke}" stroke-width="${px(1.5)}"/>`
      );

      if (glyph) {
        out.push(
          `      <text x="${projX(pt.x)}" y="${projectY(pt.y) + px(1.5)}" text-anchor="middle" dominant-baseline="middle" ` +
          `font-family="monospace" font-size="${px(5.5)}" font-weight="700" fill="#0A0A0A">` +
          `${glyph}</text>`
        );
      }
    }
    out.push('    </g>');

    out.push('</svg>');

    return {
      format: ExportFormat.SVG,
      mimeType: "image/svg+xml",
      data: out.join("\n"),
    };
  }
}

export default ExportService;