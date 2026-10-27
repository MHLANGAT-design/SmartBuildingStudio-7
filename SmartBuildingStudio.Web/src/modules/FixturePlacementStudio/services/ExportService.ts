// src/modules/FixturePlacementStudio/services/ExportService.ts

import type { FixtureLayout } from '@/modules/FixturePlacementStudio/models/FixtureLayout';
import type { ValidationReport } from '@/modules/FixturePlacementStudio/services/ValidationService';
import { serializeFixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import { serializeZone } from '@/modules/FixturePlacementStudio/models/Zone';
import type { DrawingDocument } from '@/modules/FloorPlanDesigner/Document/DrawingDocument';

export type ExportFormat = 'json' | 'csv' | 'pdf' | 'dxf' | 'svg' | 'ifc' | 'rvt' | 'xlsx';

export interface ExportOptions {
  /** Optional validation report to include. Required for PDF. */
  validationReport?: ValidationReport;
  /** Include zones in the output (where applicable). */
  includeZones?: boolean;
}

export interface ExportResult {
  format: ExportFormat;
  /** MIME type for the download. */
  mimeType: string;
  /** Suggested file name (without directory). */
  fileName: string;
  /** Payload: Blob for binary formats, string for text. */
  content: Blob | string;
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

// ─── SVG Helpers ─────────────────────────────────────────────────────────────

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

  if (type === "rawgeometry" || layer === "rawgeometry" || layer === "raw") return "raw";
  if (type === "room" || type === "rooms" || el.isRoom === true) return "room";
  if (type.includes("door") || layer.includes("door") || layer === "dr") return "door";
  if (type.includes("window") || layer.includes("window") || layer.includes("glaz") || layer === "wd") return "window";
  
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

  if (type === "fixture" || normalizedType === "luminaire" || el.isFixture === true) return "fixture";
  return "other";
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ExportService {
  static async export(
    format: ExportFormat,
    layout: FixtureLayout,
    drawingDocument?: DrawingDocument,
    options?: ExportOptions
  ): Promise<ExportResult> {
    switch (format) {
      case 'json':
        return ExportService.toJson(layout, options);
      case 'csv':
        return ExportService.toCsv(layout);
      case 'pdf':
        return ExportService.toPdf(layout, options);
      case 'dxf':
        return ExportService.toDxf(layout, options);
      case 'svg':
        return ExportService.toSvg(layout, drawingDocument, options);
      case 'ifc':
        throw new Error('IFC export is not implemented in v1.0.');
      case 'rvt':
        throw new Error('Revit export is not implemented in v1.0.');
      case 'xlsx':
        throw new Error('XLSX export is not implemented in v1.0.');
    }
  }

  // ─── JSON ────────────────────────────────────────────────────────────

  private static toJson(
    layout: FixtureLayout,
    options?: ExportOptions
  ): ExportResult {
    const payload = {
      documentId: layout.documentId,
      revision: layout.revision,
      exportedAt: new Date().toISOString(),
      fixtures: layout.fixtures.map(serializeFixture),
      zones: options?.includeZones === false ? undefined : layout.zones.map(serializeZone),
      validation: options?.validationReport ?? undefined,
    };
    return {
      format: 'json',
      mimeType: 'application/json',
      fileName: `fixture-layout-${layout.documentId}.json`,
      content: JSON.stringify(payload, null, 2),
    };
  }

  // ─── CSV ─────────────────────────────────────────────────────────────

  private static toCsv(layout: FixtureLayout): ExportResult {
    const header = [
      'id',
      'kind',
      'productId',
      'x',
      'y',
      'rotation',
      'elevation',
      'roomId',
      'zoneIds',
    ];
    const rows: string[] = [header.join(',')];

    const zoneMembership = new Map<string, string[]>();
    for (const zone of layout.zones) {
      for (const fid of zone.memberFixtureIds) {
        if (!zoneMembership.has(fid)) zoneMembership.set(fid, []);
        zoneMembership.get(fid)!.push(zone.id);
      }
    }

    for (const fixture of layout.fixtures) {
      const zones = zoneMembership.get(fixture.id)?.join(';') ?? '';
      rows.push([
        ExportService.csvCell(fixture.id),
        ExportService.csvCell(fixture.kind),
        ExportService.csvCell(fixture.productId),
        fixture.x.toString(),
        fixture.y.toString(),
        fixture.rotation.toString(),
        (fixture.elevation ?? 0).toString(),
        ExportService.csvCell(fixture.roomId ?? ''),
        ExportService.csvCell(zones),
      ].join(','));
    }

    return {
      format: 'csv',
      mimeType: 'text/csv',
      fileName: `fixture-layout-${layout.documentId}.csv`,
      content: rows.join('\n'),
    };
  }

  private static csvCell(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  // ─── PDF ─────────────────────────────────────────────────────────────

  private static toPdf(
    layout: FixtureLayout,
    options?: ExportOptions
  ): ExportResult {
    const report = options?.validationReport;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Fixture Layout Report — ${ExportService.htmlEscape(layout.documentId)}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2em; color: #111; }
  h1 { font-size: 18pt; border-bottom: 1px solid #444; padding-bottom: 4pt; }
  h2 { font-size: 14pt; margin-top: 1.5em; }
  table { border-collapse: collapse; width: 100%; font-size: 10pt; }
  th, td { border: 1px solid #ccc; padding: 4pt 6pt; text-align: left; }
  th { background: #f0f0f0; }
  .pass { color: #0a7a34; font-weight: bold; }
  .fail { color: #b00020; font-weight: bold; }
  .warn { color: #b26a00; }
</style>
</head>
<body>
<h1>Fixture Layout Report</h1>
<p><strong>Document:</strong> ${ExportService.htmlEscape(layout.documentId)}<br>
<strong>Revision:</strong> ${layout.revision}<br>
<strong>Generated:</strong> ${new Date().toISOString()}</p>

<h2>Summary</h2>
<p>
  <strong>Fixtures:</strong> ${layout.fixtures.length}<br>
  <strong>Zones:</strong> ${layout.zones.length}
</p>

${report ? `
<h2>Validation</h2>
<p>
  Status: <span class="${report.passed ? 'pass' : 'fail'}">
    ${report.passed ? 'PASSED' : 'FAILED'}
  </span><br>
  Errors: ${report.errorCount} · Warnings: ${report.warningCount} · Info: ${report.infoCount}
</p>
${report.violations.length > 0 ? `
<table>
<thead><tr><th>Severity</th><th>Rule</th><th>Message</th></tr></thead>
<tbody>
${report.violations.map(v => `
<tr>
  <td class="${v.severity === 'error' ? 'fail' : v.severity === 'warning' ? 'warn' : ''}">${v.severity.toUpperCase()}</td>
  <td>${ExportService.htmlEscape(v.ruleKind)}</td>
  <td>${ExportService.htmlEscape(v.message)}</td>
</tr>`).join('')}
</tbody>
</table>` : '<p>No violations.</p>'}
` : ''}

<h2>Fixtures</h2>
<table>
<thead><tr><th>ID</th><th>Kind</th><th>Product</th><th>X</th><th>Y</th><th>Rot</th></tr></thead>
<tbody>
${layout.fixtures.map(f => `
<tr>
  <td>${ExportService.htmlEscape(f.id)}</td>
  <td>${ExportService.htmlEscape(f.kind)}</td>
  <td>${ExportService.htmlEscape(f.productId)}</td>
  <td>${f.x.toFixed(2)}</td>
  <td>${f.y.toFixed(2)}</td>
  <td>${f.rotation.toFixed(4)}</td>
</tr>`).join('')}
</tbody>
</table>

<script>window.addEventListener('load', () => window.print());</script>
</body>
</html>`;

    return {
      format: 'pdf',
      mimeType: 'text/html',
      fileName: `fixture-layout-${layout.documentId}.html`,
      content: html,
    };
  }

  private static htmlEscape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── DXF ─────────────────────────────────────────────────────────────

  private static toDxf(
    layout: FixtureLayout,
    options?: ExportOptions
  ): ExportResult {
    const lines: string[] = [];

    const push = (code: string | number, value: string | number): void => {
      lines.push(String(code));
      lines.push(String(value));
    };

    push(0, 'SECTION');
    push(2, 'HEADER');
    push(0, 'ENDSEC');

    push(0, 'SECTION');
    push(2, 'ENTITIES');

    for (const fixture of layout.fixtures) {
      push(0, 'POINT');
      push(8, 'FI-PLACEMENT');
      push(10, fixture.x);
      push(20, fixture.y);
      push(30, 0);

      push(0, 'TEXT');
      push(8, 'FI-PLACEMENT-ANNOT');
      push(10, fixture.x + 0.2);
      push(20, fixture.y + 0.2);
      push(30, 0);
      push(40, 0.3);
      push(1, fixture.kind.toUpperCase());
    }

    if (options?.includeZones) {
      // Zone boundaries are derived, not authored.
    }

    push(0, 'ENDSEC');
    push(0, 'EOF');

    return {
      format: 'dxf',
      mimeType: 'application/dxf',
      fileName: `fixture-layout-${layout.documentId}.dxf`,
      content: lines.join('\n'),
    };
  }

  // ─── SVG ─────────────────────────────────────────────────────────────

  private static toSvg(
    layout: FixtureLayout,
    drawingDocument?: DrawingDocument,
    options?: ExportOptions
  ): ExportResult {
    const elements = drawingDocument ? drawingDocument.getElements() : [];
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
      if (kind === "other") continue;

      const pts = getBounds(el);
      if (kind === "room" && pts.length < 3) continue;
      if (kind !== "room" && pts.length < 2 && kind !== "fixture") continue;

      for (const p of pts) includePt(p);
      validElements.push({ el, kind });
    }

    // Ensure fixtures are included in bounds
    for (const f of layout.fixtures) {
      includePt({ x: f.x, y: f.y });
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

    // Direct Y projection without SVG transforms
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
      
      if (el.name) {
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

    // 3d. Fixtures (from the layout, not the drawing elements)
    out.push('    <g id="fixtures">');
    for (const f of layout.fixtures) {
      const pt = { x: f.x, y: f.y };
      const r = px(5);
      
      const rawKind = String(f.kind ?? "").toLowerCase().replace(/[_\s-]/g, "");
      
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
      format: 'svg',
      mimeType: 'image/svg+xml',
      fileName: `fixture-layout-${layout.documentId}.svg`,
      content: out.join("\n"),
    };
  }
}

export default ExportService;