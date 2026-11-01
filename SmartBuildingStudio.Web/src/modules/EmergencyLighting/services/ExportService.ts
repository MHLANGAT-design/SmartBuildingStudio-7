// src/modules/EmergencyLighting/services/ExportService.ts
//
// Converts EmergencyLighting Redux state into exportable documents.
//
// Follows the FixturePlacementStudio/services/ExportService.ts pattern:
// the service is pure (input in, ExportResult out) and does NOT trigger
// downloads — callers invoke downloadBlob() with the returned content.
//
// Four formats are supported:
//   • csv  — compliance issues, evacuation routes, emergency fixtures,
//            in three back-to-back sections in one file
//   • json — full snapshot with summary stats and resolved room names
//   • pdf  — printable HTML (window.print() → native "Save as PDF")
//   • svg  — vector drawing of the floorplan with emergency fixtures,
//            exit signs, evacuation routes, coverage zones, and
//            (optionally) compliance tints. Matches FPS's toSvg style.
//
// Input contract: the caller assembles EmergencyExportInput from Redux
// selectors. Notably:
//   • fixtures must come from selectEmergencyLightFixtures(state)
//     (filters kind === 'emergencyLight' via isEmergencyLight), not
//     from model.fixtures or model.electricalFixtures — otherwise the
//     inventory section will include non-emergency luminaires.
//   • rooms can come from model.rooms or model.elements (filtered by
//     type === 'room'). Both shapes are accepted.
//   • elements (for SVG export) come from model.elements — the same
//     array EmergencyCanvas passes to CanvasRenderer.
//
// Room-scoped issues: the compliance engine embeds the room id in the
// issue id as `issue-<kind>-<roomId>` (see ComplianceOverlay.tsx for
// the same regex). This service parses it out the same way.

// ─── Public types ────────────────────────────────────────────────────────

export type ExportFormat = 'csv' | 'json' | 'pdf' | 'svg';

export interface ExportOptions {
  includeRoutes?: boolean;
  includeFixtures?: boolean;
  includeComplianceTints?: boolean;
  projectName?: string;
}

export interface ExportResult {
  format: ExportFormat;
  mimeType: string;
  fileName: string;
  content: Blob | string;
}

export interface Point {
  x: number;
  y: number;
}

export interface ComplianceIssue {
  id: string;
  ruleId: string;
  severity: 'error' | 'warning' | 'info' | string;
  message: string;
  location?: Point;
}

export interface RoomElement {
  id?: string;
  Id?: string;
  name?: string;
  points?: Point[];
  vertices?: Point[];
  targetLux?: number;
  primaryGroup?: number;
  area?: number;
}

export interface EvacuationRoute {
  id: string;
  name?: string;
  points?: Point[];
  startNode?: Point;
  endNode?: Point;
  lengthMeters: number;
  isCompliant: boolean;
}

export interface EmergencyFixture {
  id: string;
  x: number;
  y: number;
  kind?: string;
  type?: string;
  productId?: string;
  rotation?: number;
  roomId?: string;
  elevation?: number;
  layerId?: string;
  daliGroup?: number;
  emergencyLight?: {
    operationMode?: string;
    classification?: string;
    autonomyMinutes?: number;
    onEscapeRoute?: boolean;
  };
}

export interface EmergencyExportInput {
  issues: ComplianceIssue[];
  simulationStatus: string;
  rooms: RoomElement[];
  routes: EvacuationRoute[];
  fixtures: EmergencyFixture[];
  /** From model.elements — used only by toSvg for walls/doors/windows. */
  elements?: any[];
  documentName?: string;
  projectName?: string;
  generatedAt?: Date;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function extractRoomId(issue: ComplianceIssue): string | null {
  const direct = (issue as any)?.roomId ?? (issue as any)?.roomID;
  if (direct != null && String(direct) !== '') return String(direct);
  const m = /^issue-(?:cov|visibility-(?:dark|avg))-(.+)$/.exec(
    String(issue?.id ?? '')
  );
  return m ? m[1] : null;
}

function roomIdOf(room: RoomElement): string {
  return String(room.id ?? room.Id ?? '');
}

function roomNameById(rooms: RoomElement[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of rooms) {
    const id = roomIdOf(r);
    if (!id) continue;
    map.set(id, String(r.name ?? '(unnamed)'));
  }
  return map;
}

function roomPolygonById(rooms: RoomElement[]): Map<string, Point[]> {
  const map = new Map<string, Point[]>();
  for (const r of rooms) {
    const id = roomIdOf(r);
    if (!id) continue;
    const pts = r.points || r.vertices || [];
    if (Array.isArray(pts) && pts.length >= 3) map.set(id, pts);
  }
  return map;
}

function severityCounts(issues: ComplianceIssue[]): {
  error: number;
  warning: number;
  info: number;
  total: number;
} {
  let error = 0;
  let warning = 0;
  let info = 0;
  for (const i of issues) {
    if (i.severity === 'error') error++;
    else if (i.severity === 'warning') warning++;
    else info++;
  }
  return { error, warning, info, total: issues.length };
}

function safeFileName(name: string | undefined | null, fallback: string): string {
  return (
    (name || fallback)
      .replace(/[/\\<>:"|?*\s]+/g, '_')
      .replace(/^[._]+|[._]+$/g, '') || fallback
  );
}

function csvCell(value: unknown): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function htmlEscape(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function xmlEscape(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function boolToYesNo(v: boolean | undefined): string {
  if (v === true) return 'yes';
  if (v === false) return 'no';
  return '';
}

// ─── SVG helpers ─────────────────────────────────────────────────────────

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

function classifyElement(
  el: any
): 'room' | 'wall' | 'door' | 'window' | 'raw' | 'fixture' | 'other' {
  if (!el) return 'other';
  const type = String(el.type || '').toLowerCase();
  const layer = String(el.layer || el.originalLayer || '').toLowerCase();
  if (type === 'rawgeometry' || layer === 'rawgeometry' || layer === 'raw') return 'raw';
  if (type === 'room' || type === 'rooms' || el.isRoom === true) return 'room';
  if (type.includes('door') || layer.includes('door') || layer === 'dr') return 'door';
  if (
    type.includes('window') ||
    layer.includes('window') ||
    layer.includes('glaz') ||
    layer === 'wd'
  ) {
    return 'window';
  }
  const normalizedType = type.replace(/[_\s-]/g, '');
  if (
    type === 'wall' ||
    type === 'walls' ||
    normalizedType === 'polyline' ||
    layer.includes('wall') ||
    el.thickness !== undefined
  ) {
    return 'wall';
  }
  if (type === 'fixture' || normalizedType === 'luminaire' || el.isFixture === true) {
    return 'fixture';
  }
  return 'other';
}

const FIXTURE_GLYPH_BY_MODE: Record<string, { letter: string; color: string }> = {
  maintained: { letter: 'M', color: '#38BDF8' },
  'non-maintained': { letter: 'N', color: '#F59E0B' },
  combined: { letter: 'C', color: '#A855F7' },
};
const FIXTURE_GLYPH_DEFAULT = { letter: 'E', color: '#94A3B8' };

const COVERAGE_RADIUS_MM: Record<string, number> = {
  'escape-route': 5000,
  'open-area': 8000,
  'high-risk-task': 3000,
};
const COVERAGE_RADIUS_DEFAULT_MM = 4000;

const SEVERITY_COLOR: Record<string, string> = {
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#38BDF8',
};
const SEVERITY_FILL: Record<string, string> = {
  error: 'rgba(239, 68, 68, 0.18)',
  warning: 'rgba(245, 158, 11, 0.15)',
  info: 'rgba(56, 189, 248, 0.12)',
};

// ─── Service ─────────────────────────────────────────────────────────────

export class ExportService {
  static async export(
    format: ExportFormat,
    input: EmergencyExportInput,
    options?: ExportOptions
  ): Promise<ExportResult> {
    switch (format) {
      case 'csv':
        return ExportService.toCsv(input, options);
      case 'json':
        return ExportService.toJson(input, options);
      case 'pdf':
        return ExportService.toPdf(input, options);
      case 'svg':
        return ExportService.toSvg(input, options);
    }
  }

  private static toCsv(input: EmergencyExportInput, options?: ExportOptions): ExportResult {
    const nameMap = roomNameById(input.rooms);
    const lines: string[] = [];

    lines.push('# COMPLIANCE ISSUES');
    lines.push(['id','severity','ruleId','roomId','roomName','message','locationX','locationY'].join(','));
    for (const issue of input.issues) {
      const rid = extractRoomId(issue);
      const rname = rid ? nameMap.get(rid) ?? '' : '';
      lines.push([
        csvCell(issue.id),
        csvCell(issue.severity),
        csvCell(issue.ruleId),
        csvCell(rid ?? ''),
        csvCell(rname),
        csvCell(issue.message),
        issue.location?.x ?? '',
        issue.location?.y ?? '',
      ].join(','));
    }

    if (options?.includeRoutes !== false) {
      lines.push('');
      lines.push('# EVACUATION ROUTES');
      lines.push(['id','name','lengthMeters','isCompliant','startX','startY','endX','endY'].join(','));
      for (const route of input.routes) {
        lines.push([
          csvCell(route.id),
          csvCell(route.name ?? ''),
          route.lengthMeters.toFixed(2),
          route.isCompliant ? 'yes' : 'no',
          route.startNode?.x ?? '',
          route.startNode?.y ?? '',
          route.endNode?.x ?? '',
          route.endNode?.y ?? '',
        ].join(','));
      }
    }

    if (options?.includeFixtures !== false) {
      lines.push('');
      lines.push('# EMERGENCY FIXTURES');
      lines.push([
        'id','x','y','kind','productId','roomId','roomName',
        'classification','operationMode','autonomyMinutes','onEscapeRoute','daliGroup',
      ].join(','));
      for (const f of input.fixtures) {
        const fixRoomName = f.roomId ? nameMap.get(f.roomId) ?? '' : '';
        lines.push([
          csvCell(f.id),
          f.x.toFixed(2),
          f.y.toFixed(2),
          csvCell(f.kind ?? ''),
          csvCell(f.productId ?? ''),
          csvCell(f.roomId ?? ''),
          csvCell(fixRoomName),
          csvCell(f.emergencyLight?.classification ?? ''),
          csvCell(f.emergencyLight?.operationMode ?? ''),
          f.emergencyLight?.autonomyMinutes ?? '',
          boolToYesNo(f.emergencyLight?.onEscapeRoute),
          f.daliGroup ?? '',
        ].join(','));
      }
    }

    const name = safeFileName(input.projectName ?? input.documentName, 'emergency');
    return {
      format: 'csv',
      mimeType: 'text/csv;charset=utf-8',
      fileName: `${name}-compliance.csv`,
      content: lines.join('\n'),
    };
  }

  private static toJson(input: EmergencyExportInput, options?: ExportOptions): ExportResult {
    const nameMap = roomNameById(input.rooms);
    const issues = input.issues.map((i) => {
      const rid = extractRoomId(i);
      return { ...i, roomId: rid, roomName: rid ? nameMap.get(rid) ?? null : null };
    });

    const referencedRoomIds = new Set(issues.map((i) => i.roomId).filter(Boolean) as string[]);
    const includedRooms =
      referencedRoomIds.size > 0
        ? input.rooms.filter((r) => referencedRoomIds.has(roomIdOf(r)))
        : input.rooms;

    const payload = {
      generatedAt: (input.generatedAt ?? new Date()).toISOString(),
      simulationStatus: input.simulationStatus,
      documentName: input.documentName ?? null,
      projectName: input.projectName ?? null,
      summary: severityCounts(input.issues),
      issues,
      rooms: includedRooms,
      routes: options?.includeRoutes === false ? undefined : input.routes,
      fixtures: options?.includeFixtures === false ? undefined : input.fixtures,
    };

    const name = safeFileName(input.projectName ?? input.documentName, 'emergency');
    return {
      format: 'json',
      mimeType: 'application/json',
      fileName: `${name}-compliance.json`,
      content: JSON.stringify(payload, null, 2),
    };
  }

  private static toPdf(input: EmergencyExportInput, options?: ExportOptions): ExportResult {
    const nameMap = roomNameById(input.rooms);
    const counts = severityCounts(input.issues);
    const docName = input.projectName ?? input.documentName ?? 'Emergency Lighting Project';

    const byRoom = new Map<string, ComplianceIssue[]>();
    const unattached: ComplianceIssue[] = [];
    for (const issue of input.issues) {
      const rid = extractRoomId(issue);
      if (rid) {
        const list = byRoom.get(rid) ?? [];
        list.push(issue);
        byRoom.set(rid, list);
      } else {
        unattached.push(issue);
      }
    }

    const renderIssueRow = (issue: ComplianceIssue): string => `
      <tr>
        <td class="sev sev-${htmlEscape(issue.severity)}">${htmlEscape(issue.severity.toUpperCase())}</td>
        <td>${htmlEscape(issue.ruleId)}</td>
        <td>${htmlEscape(issue.message)}</td>
      </tr>`;

    const roomSections = Array.from(byRoom.entries())
      .map(([rid, issues]) => {
        const roomName = nameMap.get(rid) ?? rid;
        return `
      <h3>${htmlEscape(roomName)} <span class="room-id">(${htmlEscape(rid)})</span></h3>
      <table>
        <thead><tr><th>Severity</th><th>Rule</th><th>Message</th></tr></thead>
        <tbody>${issues.map(renderIssueRow).join('')}</tbody>
      </table>`;
      })
      .join('');

    const unattachedSection =
      unattached.length > 0
        ? `
      <h3>Unattached Issues</h3>
      <table>
        <thead><tr><th>Severity</th><th>Rule</th><th>Message</th></tr></thead>
        <tbody>${unattached.map(renderIssueRow).join('')}</tbody>
      </table>`
        : '';

    const routesSection =
      options?.includeRoutes === false
        ? ''
        : `
      <h2>Evacuation Routes</h2>
      <table>
        <thead><tr><th>ID</th><th>Name</th><th>Length (m)</th><th>Compliant</th></tr></thead>
        <tbody>
          ${input.routes
            .map(
              (r) => `
            <tr>
              <td>${htmlEscape(r.id)}</td>
              <td>${htmlEscape(r.name ?? '—')}</td>
              <td>${r.lengthMeters.toFixed(2)}</td>
              <td class="${r.isCompliant ? 'pass' : 'fail'}">${r.isCompliant ? 'YES' : 'NO'}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>`;

    const fixturesSection =
      options?.includeFixtures === false
        ? ''
        : `
      <h2>Emergency Fixtures (${input.fixtures.length})</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Product</th><th>Room</th><th>Classification</th>
            <th>Mode</th><th>Autonomy</th><th>On Escape</th><th>X</th><th>Y</th>
          </tr>
        </thead>
        <tbody>
          ${input.fixtures
            .map(
              (f) => `
            <tr>
              <td>${htmlEscape(f.id)}</td>
              <td>${htmlEscape(f.productId ?? '—')}</td>
              <td>${htmlEscape(f.roomId ? nameMap.get(f.roomId) ?? '—' : '—')}</td>
              <td>${htmlEscape(f.emergencyLight?.classification ?? '—')}</td>
              <td>${htmlEscape(f.emergencyLight?.operationMode ?? '—')}</td>
              <td>${htmlEscape(
                f.emergencyLight?.autonomyMinutes != null
                  ? `${f.emergencyLight.autonomyMinutes} min`
                  : '—'
              )}</td>
              <td>${htmlEscape(boolToYesNo(f.emergencyLight?.onEscapeRoute) || '—')}</td>
              <td>${f.x.toFixed(0)}</td>
              <td>${f.y.toFixed(0)}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>`;

    const generatedAt = (input.generatedAt ?? new Date()).toISOString();

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Emergency Lighting Compliance Report — ${htmlEscape(docName)}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2em; color: #111; }
  h1 { font-size: 20pt; border-bottom: 2px solid #444; padding-bottom: 6pt; }
  h2 { font-size: 14pt; margin-top: 1.5em; border-bottom: 1px solid #ccc; padding-bottom: 4pt; }
  h3 { font-size: 12pt; margin-top: 1em; }
  table { border-collapse: collapse; width: 100%; font-size: 9.5pt; margin-bottom: 1em; }
  th, td { border: 1px solid #ccc; padding: 4pt 6pt; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; }
  .summary { display: flex; gap: 2em; margin: 1em 0; font-size: 11pt; }
  .summary div { padding: 6pt 10pt; border-radius: 4pt; background: #f8f8f8; }
  .sev-error { color: #b00020; font-weight: bold; }
  .sev-warning { color: #b26a00; font-weight: bold; }
  .sev-info { color: #0a6c9b; font-weight: bold; }
  .pass { color: #0a7a34; font-weight: bold; }
  .fail { color: #b00020; font-weight: bold; }
  .room-id { font-size: 8pt; color: #888; font-weight: normal; }
</style>
</head>
<body>
<h1>Emergency Lighting Compliance Report</h1>
<p>
  <strong>Project:</strong> ${htmlEscape(docName)}<br>
  <strong>Generated:</strong> ${htmlEscape(generatedAt)}<br>
  <strong>Simulation status:</strong> ${htmlEscape(input.simulationStatus)}
</p>

<h2>Summary</h2>
<div class="summary">
  <div><strong>${counts.total}</strong> total issues</div>
  <div><span class="sev-error">${counts.error} errors</span></div>
  <div><span class="sev-warning">${counts.warning} warnings</span></div>
  <div><span class="sev-info">${counts.info} info</span></div>
</div>

<h2>Compliance Findings</h2>
${roomSections || '<p>No room-scoped issues.</p>'}
${unattachedSection}

${routesSection}
${fixturesSection}

<script>window.addEventListener('load', () => window.print());</script>
</body>
</html>`;

    const name = safeFileName(docName, 'emergency');
    return {
      format: 'pdf',
      mimeType: 'text/html',
      fileName: `${name}-compliance.html`,
      content: html,
    };
  }

  private static toSvg(input: EmergencyExportInput, options?: ExportOptions): ExportResult {
    const elements = Array.isArray(input.elements) ? input.elements : [];
    const roomPoly = roomPolygonById(input.rooms);
    const docName = input.projectName ?? input.documentName ?? 'Emergency Lighting Project';
    const generatedAt = (input.generatedAt ?? new Date()).toISOString();
    const counts = severityCounts(input.issues);

    const validElements: Array<{ el: any; kind: string }> = [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const includePt = (p: Point) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    };

    for (const el of elements) {
      const kind = classifyElement(el);
      if (kind === 'other' || kind === 'fixture') continue;
      const pts = getBounds(el);
      if (kind === 'room' && pts.length < 3) continue;
      if (kind !== 'room' && pts.length < 2) continue;
      for (const p of pts) includePt(p);
      validElements.push({ el, kind });
    }

    for (const f of input.fixtures) includePt({ x: f.x, y: f.y });
    for (const r of input.routes) for (const p of r.points ?? []) includePt(p);
    for (const poly of roomPoly.values()) for (const p of poly) includePt(p);
    for (const f of input.fixtures) {
      const cls = f.emergencyLight?.classification ?? 'unknown';
      const radiusMm = COVERAGE_RADIUS_MM[cls] ?? COVERAGE_RADIUS_DEFAULT_MM;
      includePt({ x: f.x - radiusMm, y: f.y - radiusMm });
      includePt({ x: f.x + radiusMm, y: f.y + radiusMm });
    }

    const hasGeometry = Number.isFinite(minX) && Number.isFinite(maxX);
    if (!hasGeometry) { minX = 0; minY = 0; maxX = 800; maxY = 600; }

    const pad = hasGeometry ? Math.max(400, (maxX - minX) * 0.03) : 20;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);

    const aspect = width / height;
    const TARGET_LONG_EDGE = 1800;
    const outW = aspect >= 1 ? TARGET_LONG_EDGE : Math.round(TARGET_LONG_EDGE * aspect);
    const outH = aspect >= 1 ? Math.round(TARGET_LONG_EDGE / aspect) : TARGET_LONG_EDGE;
    const worldPerPx = width / outW;
    const px = (n: number) => n * worldPerPx;

    const projX = (x: number) => x - minX;
    const projY = (y: number) => maxY - y;
    const xy = (p: Point) => `${projX(p.x)},${projY(p.y)}`;

    const out: string[] = [];
    out.push('<?xml version="1.0" encoding="UTF-8"?>');
    out.push(
      `<svg xmlns="http://www.w3.org/2000/svg" ` +
        `viewBox="0 0 ${width} ${height}" ` +
        `width="${outW}" height="${outH}" ` +
        `preserveAspectRatio="xMidYMid meet">`
    );
    out.push(`  <rect width="${width}" height="${height}" fill="#0B0F19"/>`);

    // Raw geometry
    out.push('  <g id="rawgeometry" fill="none" stroke="#94A3B8" stroke-linejoin="round" stroke-linecap="round">');
    for (const { el, kind } of validElements) {
      if (kind !== 'raw') continue;
      const pts = getBounds(el);
      if (pts.length < 2) continue;
      out.push(`    <polyline points="${pts.map(xy).join(' ')}" stroke-width="${px(0.75)}"/>`);
    }
    out.push('  </g>');

    // Compliance tints
    if (options?.includeComplianceTints !== false) {
      out.push('  <g id="compliance-tints">');
      for (const issue of input.issues) {
        const rid = extractRoomId(issue);
        if (!rid) continue;
        const poly = roomPoly.get(rid);
        if (!poly) continue;
        const fill = SEVERITY_FILL[issue.severity] ?? SEVERITY_FILL.info;
        const stroke = SEVERITY_COLOR[issue.severity] ?? SEVERITY_COLOR.info;
        out.push(
          `    <polygon points="${poly.map(xy).join(' ')}" ` +
            `fill="${fill}" stroke="${stroke}" ` +
            `stroke-width="${px(2)}" stroke-dasharray="${px(6)} ${px(4)}" opacity="0.7"/>`
        );
      }
      out.push('  </g>');
    }

    // Rooms
    out.push('  <g id="rooms">');
    for (const { el, kind } of validElements) {
      if (kind !== 'room') continue;
      const pts = getBounds(el);
      if (pts.length < 3) continue;
      const fill = typeof el.fillStyle === 'string' && el.fillStyle ? el.fillStyle : 'rgba(74, 222, 128, 0.12)';
      const stroke = typeof el.strokeStyle === 'string' && el.strokeStyle ? el.strokeStyle : '#4ADE80';
      out.push(
        `    <polygon points="${pts.map(xy).join(' ')}" ` +
          `fill="${fill}" stroke="${stroke}" stroke-width="${px(1.5)}" stroke-linejoin="round"/>`
      );
      if (el.name) {
        let cx = 0, cy = 0;
        for (const p of pts) { cx += p.x; cy += p.y; }
        cx /= pts.length; cy /= pts.length;
        out.push(
          `    <text x="${projX(cx)}" y="${projY(cy)}" text-anchor="middle" dominant-baseline="middle" ` +
            `font-family="sans-serif" font-size="${px(11)}" font-weight="700" ` +
            `fill="#4ADE80" opacity="0.9">${xmlEscape(String(el.name))}</text>`
        );
      }
    }
    out.push('  </g>');

    // Walls / doors / windows
    out.push('  <g id="structures" fill="none" stroke-linejoin="round" stroke-linecap="round">');
    for (const { el, kind } of validElements) {
      if (kind !== 'wall' && kind !== 'door' && kind !== 'window') continue;
      let stroke = '#9CA3AF';
      let sw = px(2);
      if (kind === 'wall') { stroke = '#9CA3AF'; sw = px(2.5); }
      else if (kind === 'door') { stroke = '#EAB308'; sw = px(3); }
      else if (kind === 'window') { stroke = '#4FC3F7'; sw = px(3.5); }

      if (Array.isArray(el.primitives) && el.primitives.length > 0) {
        for (const prim of el.primitives) {
          if (prim.kind === 'line' && prim.points && prim.points.length >= 2) {
            const a = prim.points[0], b = prim.points[1];
            out.push(`    <line x1="${projX(a.x)}" y1="${projY(a.y)}" x2="${projX(b.x)}" y2="${projY(b.y)}" stroke="${stroke}" stroke-width="${sw}"/>`);
          } else if (prim.kind === 'arc' && prim.center && prim.radius != null && prim.startAngle != null && prim.endAngle != null) {
            const { center, radius, startAngle, endAngle } = prim;
            const sx = center.x + radius * Math.cos(startAngle);
            const sy = center.y + radius * Math.sin(startAngle);
            const ex = center.x + radius * Math.cos(endAngle);
            const ey = center.y + radius * Math.sin(endAngle);
            let angleDiff = endAngle - startAngle;
            while (angleDiff < 0) angleDiff += 2 * Math.PI;
            while (angleDiff >= 2 * Math.PI) angleDiff -= 2 * Math.PI;
            const largeArc = angleDiff > Math.PI ? 1 : 0;
            const rPx = radius / worldPerPx;
            out.push(`    <path d="M ${projX(sx)} ${projY(sy)} A ${rPx} ${rPx} 0 ${largeArc} 0 ${projX(ex)} ${projY(ey)}" stroke="${stroke}" stroke-width="${sw}"/>`);
          } else if (prim.points) {
            out.push(`    <polyline points="${prim.points.map(xy).join(' ')}" stroke="${stroke}" stroke-width="${sw}"/>`);
          }
        }
      } else {
        const pts = getBounds(el);
        if (pts.length >= 2) {
          out.push(`    <polyline points="${pts.map(xy).join(' ')}" stroke="${stroke}" stroke-width="${sw}"/>`);
        }
      }
    }
    out.push('  </g>');

    // *** CONTINUE IN PART 2 ***    // Coverage zones — one dashed circle per emergency fixture
    out.push('  <g id="coverage-zones" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.35)" stroke-width="1" stroke-dasharray="4 3">');
    for (const f of input.fixtures) {
      const cls = f.emergencyLight?.classification ?? 'unknown';
      const radiusMm = COVERAGE_RADIUS_MM[cls] ?? COVERAGE_RADIUS_DEFAULT_MM;
      const rPx = radiusMm / worldPerPx;
      if (rPx < 2) continue;
      out.push(
        `    <circle cx="${projX(f.x)}" cy="${projY(f.y)}" r="${rPx}"/>`
      );
    }
    out.push('  </g>');

    // Emergency fixture glyphs (M / N / C / E)
    out.push('  <g id="emergency-fixtures">');
    for (const f of input.fixtures) {
      const cls = f.emergencyLight?.classification;
      if (cls === 'exit-sign') continue; // exit signs drawn separately below
      const mode = f.emergencyLight?.operationMode;
      const glyph = (mode && FIXTURE_GLYPH_BY_MODE[mode]) || FIXTURE_GLYPH_DEFAULT;
      const cx = projX(f.x);
      const cy = projY(f.y);
      const r = px(8);
      out.push(
        `    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${glyph.color}" stroke="#0B0F19" stroke-width="${px(2)}"/>`
      );
      out.push(
        `    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" ` +
          `font-family="monospace" font-size="${px(10)}" font-weight="700" fill="#0B0F19">` +
          `${xmlEscape(glyph.letter)}</text>`
      );
    }
    out.push('  </g>');

    // Exit signs — green EXIT box with a small direction arrow
    out.push('  <g id="exit-signs">');
    for (const f of input.fixtures) {
      if (f.emergencyLight?.classification !== 'exit-sign') continue;
      const cx = projX(f.x);
      const cy = projY(f.y);
      const w = px(34);
      const h = px(16);
      out.push(
        `    <g transform="translate(${cx}, ${cy})">` +
          `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${px(3)}" ` +
          `fill="#10B981" stroke="#10B981" stroke-width="${px(1.5)}"/>` +
          `<text x="${-px(2)}" y="0" text-anchor="middle" dominant-baseline="middle" ` +
          `font-family="monospace" font-size="${px(9)}" font-weight="700" fill="#0B0F19">EXIT</text>` +
          `<path d="M ${w / 2 - px(4)} 0 L ${w / 2 - px(10)} ${-px(4)} L ${w / 2 - px(10)} ${px(4)} Z" fill="#0B0F19"/>` +
          `</g>`
      );
    }
    out.push('  </g>');

    // Evacuation routes — green if compliant, red if not; length label at midpoint
    if (options?.includeRoutes !== false) {
      out.push('  <g id="evacuation-routes" fill="none" stroke-linejoin="round" stroke-linecap="round">');
      for (const route of input.routes) {
        const pts = route.points ?? [];
        if (pts.length < 2) continue;
        const polyline = pts.map(xy).join(' ');
        const color = route.isCompliant ? '#10B981' : '#EF4444';
        out.push(
          `    <polyline points="${polyline}" stroke="${color}" stroke-width="${px(4)}"/>`
        );

        // Start / end dots
        const first = pts[0];
        const last = pts[pts.length - 1];
        out.push(
          `    <circle cx="${projX(first.x)}" cy="${projY(first.y)}" r="${px(6)}" fill="${color}" stroke="none"/>`
        );
        out.push(
          `    <circle cx="${projX(last.x)}" cy="${projY(last.y)}" r="${px(6)}" fill="${color}" stroke="none"/>`
        );

        // Length label at geometric midpoint of the polyline
        const midIdx = Math.floor(pts.length / 2);
        const mid = pts[midIdx];
        const labelW = px(48);
        const labelH = px(22);
        out.push(
          `    <rect x="${projX(mid.x) - labelW / 2}" y="${projY(mid.y) - labelH / 2}" ` +
            `width="${labelW}" height="${labelH}" fill="rgba(0,0,0,0.7)" rx="${px(4)}"/>`
        );
        out.push(
          `    <text x="${projX(mid.x)}" y="${projY(mid.y)}" text-anchor="middle" dominant-baseline="middle" ` +
            `font-family="monospace" font-size="${px(12)}" fill="${color}">` +
            `${route.lengthMeters.toFixed(1)}m</text>`
        );
      }
      out.push('  </g>');
    }

    // Title block (bottom-right corner) — project name, timestamp, severity counts
    const tbW = px(360);
    const tbH = px(90);
    const tbX = width - tbW - px(20);
    const tbY = height - tbH - px(20);
    out.push('  <g id="title-block">');
    out.push(
      `    <rect x="${tbX}" y="${tbY}" width="${tbW}" height="${tbH}" ` +
        `fill="rgba(11,15,25,0.92)" stroke="#334155" stroke-width="${px(1)}" rx="${px(4)}"/>`
    );
    out.push(
      `    <text x="${tbX + px(12)}" y="${tbY + px(20)}" ` +
        `font-family="monospace" font-size="${px(11)}" font-weight="700" fill="#E2E8F0">` +
        `${xmlEscape(docName)}</text>`
    );
    out.push(
      `    <text x="${tbX + px(12)}" y="${tbY + px(36)}" ` +
        `font-family="monospace" font-size="${px(9)}" fill="#94A3B8">` +
        `Generated: ${xmlEscape(generatedAt)}</text>`
    );
    out.push(
      `    <text x="${tbX + px(12)}" y="${tbY + px(52)}" ` +
        `font-family="monospace" font-size="${px(9)}" fill="#94A3B8">` +
        `Simulation: ${xmlEscape(input.simulationStatus)}</text>`
    );
    out.push(
      `    <text x="${tbX + px(12)}" y="${tbY + px(70)}" ` +
        `font-family="monospace" font-size="${px(9)}" font-weight="700">` +
        `<tspan fill="${SEVERITY_COLOR.error}">${counts.error} errors</tspan>` +
        `<tspan fill="#94A3B8"> · </tspan>` +
        `<tspan fill="${SEVERITY_COLOR.warning}">${counts.warning} warnings</tspan>` +
        `<tspan fill="#94A3B8"> · </tspan>` +
        `<tspan fill="${SEVERITY_COLOR.info}">${counts.info} info</tspan>` +
        `</text>`
    );
    out.push('  </g>');

    // Legend (bottom-left) — one swatch per glyph color
    const legX = px(20);
    const legY = height - px(80);
    out.push('  <g id="legend" font-family="monospace" font-size="' + px(9) + '">');
    out.push(
      `    <rect x="${legX - px(6)}" y="${legY - px(14)}" width="${px(240)}" height="${px(64)}" ` +
        `fill="rgba(11,15,25,0.85)" stroke="#334155" stroke-width="${px(1)}" rx="${px(4)}"/>`
    );
    const legendItems: Array<{ color: string; label: string }> = [
      { color: FIXTURE_GLYPH_BY_MODE.maintained.color, label: 'Maintained (M)' },
      { color: FIXTURE_GLYPH_BY_MODE['non-maintained'].color, label: 'Non-maintained (N)' },
      { color: FIXTURE_GLYPH_BY_MODE.combined.color, label: 'Combined (C)' },
      { color: FIXTURE_GLYPH_DEFAULT.color, label: 'Unclassified (E)' },
    ];
    legendItems.forEach((item, i) => {
      const y = legY + i * px(12);
      out.push(
        `    <circle cx="${legX}" cy="${y}" r="${px(4)}" fill="${item.color}" stroke="#0B0F19" stroke-width="${px(1)}"/>`
      );
      out.push(
        `    <text x="${legX + px(12)}" y="${y}" dominant-baseline="middle" fill="#E2E8F0">` +
          `${xmlEscape(item.label)}</text>`
      );
    });
    out.push('  </g>');

    out.push('</svg>');

    const name = safeFileName(docName, 'emergency');
    return {
      format: 'svg',
      mimeType: 'image/svg+xml',
      fileName: `${name}-compliance.svg`,
      content: out.join('\n'),
    };
  }
}

export default ExportService;