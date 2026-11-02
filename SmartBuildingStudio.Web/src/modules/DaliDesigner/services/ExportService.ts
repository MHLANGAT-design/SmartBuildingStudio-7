// src/modules/DaliDesigner/services/ExportService.ts

import { DaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";
import { DaliDocumentSerializer } from "@/modules/DaliDesigner/Document/DaliDocumentSerializer";
import { DaliDevice } from "@/modules/DaliDesigner/models/DaliDevice";
import { DaliLine } from "@/modules/DaliDesigner/models/DaliLine";
import { Group } from "@/modules/DaliDesigner/models/Group";
import type { FloorplanRenderModel } from "@/modules/DaliDesigner/Document/FloorplanLoader";
import { downloadBlob } from "@/Application/downloadBlob";

const DEVICE_COLOR: Record<string, string> = {
  Ballast: "#FACC15",
  Sensor:  "#FB923C",
  Switch:  "#22D3EE",
};

const DEVICE_GLYPH: Record<string, string> = {
  Ballast: "L",
  Sensor:  "S",
  Switch:  "W",
};

function deviceColor(device: DaliDevice): string {
  const sourceKind = String(device.metadata?.sourceKind ?? "").toLowerCase();
  if (sourceKind.includes("emergency")) return "#EF4444";
  return DEVICE_COLOR[device.kind] ?? "#94A3B8";
}

function deviceGlyph(device: DaliDevice): string {
  const sourceKind = String(device.metadata?.sourceKind ?? "").toLowerCase();
  if (sourceKind.includes("emergency")) return "E";
  return DEVICE_GLYPH[device.kind] ?? "";
}

const GROUP_PALETTE = [
  "#A855F7", "#F472B6", "#60A5FA", "#34D399",
  "#FBBF24", "#FB7185", "#818CF8", "#2DD4BF",
];

function escapeXml(s: string): string {
  return String(s).replace(/[<>&"']/g, (c) =>
    c === "<" ? "&lt;"
    : c === ">" ? "&gt;"
    : c === "&" ? "&amp;"
    : c === '"' ? "&quot;"
    : "&apos;"
  );
}

function safeFileName(name: string | undefined | null, fallback: string): string {
  return (
    (name || fallback)
      .replace(/[/\\<>:"|?*\s]+/g, "_")
      .replace(/^[._]+|[._]+$/g, "") || fallback
  );
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

interface Point { x: number; y: number; }

function devicePoint(device: DaliDevice): Point | null {
  const p = device.metadata?.position;
  if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
    return { x: p.x, y: p.y };
  }
  return null;
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
  
  const type = String(el.type || '').toLowerCase();
  const layer = String(el.layer || el.originalLayer || '').toLowerCase();

  if (type === 'rawgeometry' || layer === 'rawgeometry' || layer === 'raw') {
    return "raw";
  }
  
  if (type === 'room' || type === 'rooms' || el.isRoom === true) return "room";
  if (type.includes('door') || layer.includes('door') || layer === 'dr') return "door";
  if (type.includes('window') || layer.includes('window') || layer.includes('glaz') || layer === 'wd') return "window";
  
  const normalizedType = type.replace(/[_\s-]/g, '');
  if (
    type === 'wall' || 
    type === 'walls' || 
    normalizedType === 'polyline' || 
    layer.includes('wall') || 
    el.thickness !== undefined
  ) {
    return "wall";
  }

  if (type === 'fixture' || normalizedType === 'luminaire' || el.isFixture === true) return "fixture";
  return "other";
}

export const ExportService = {
  downloadJson(doc: DaliDocument): void {
    const json = JSON.stringify(DaliDocumentSerializer.toDTO(doc), null, 2);
    const safeName = safeFileName(doc.name, "network");
    downloadBlob(json, `${safeName}.dali.json`, "application/json");
  },

  downloadSvg(
    doc: DaliDocument,
    floorplan?: FloorplanRenderModel | null
  ): void {
    const dto = DaliDocumentSerializer.toDTO(doc);
    const devices = (dto.devices as DaliDevice[]) ?? [];
    const lines   = (dto.lines   as DaliLine[])   ?? [];
    const groups  = (dto.groups  as Group[])      ?? [];
    const topology =
      (dto.topology as {
        edges?: Array<{ from: string; to: string }>;
        powerSupplies?: Array<{ id: string; lineId: string; wattage: number }>;
      }) ?? { edges: [], powerSupplies: [] };

    const safeName = safeFileName(doc.name, "network");

    const positioned: Array<{ device: DaliDevice; pt: Point }> = [];
    for (const d of devices) {
      const pt = devicePoint(d);
      if (pt) positioned.push({ device: d, pt });
    }

    const fpElements: any[] = Array.isArray(floorplan?.elements)
      ? floorplan!.elements
      : [];

    const validElements: Array<{ el: any, kind: string }> = [];

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const includePt = (p: Point) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    };

    for (const { pt } of positioned) includePt(pt);

    for (const el of fpElements) {
      const kind = classifyElement(el);
      if (kind === "other" || kind === "fixture") continue;

      const pts = getBounds(el);
      if (kind === "room" && pts.length < 3) continue;
      if (kind !== "room" && pts.length < 2) continue;

      for (const p of pts) includePt(p);
      validElements.push({ el, kind });
    }

    const hasAnyGeometry = Number.isFinite(minX);
    if (!hasAnyGeometry) { minX = 0; minY = 0; maxX = 800; maxY = 600; }

    const pad = hasAnyGeometry ? Math.max(400, (maxX - minX) * 0.03) : 20;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    const width  = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);

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
    out.push(`  <rect width="${width}" height="${height}" fill="#0B0F19"/>`);

    out.push('    <g id="rawgeometry" fill="none" stroke="#94A3B8" stroke-linejoin="round" stroke-linecap="round">');
    for (const { el, kind } of validElements) {
      if (kind !== "raw") continue;
      const pts = getBounds(el);
      if (pts.length < 2) continue;
      const d = pts.map(p => `${projX(p.x)},${projectY(p.y)}`).join(" ");
      out.push(`      <polyline points="${d}" stroke-width="${px(0.75)}"/>`);
    }
    out.push('    </g>');

    out.push('    <g id="rooms">');
    for (const { el, kind } of validElements) {
      if (kind !== "room") continue;
      const pts = getBounds(el);
      if (pts.length < 3) continue;

      const d = pts.map(p => `${projX(p.x)},${projectY(p.y)}`).join(" ");
      const fill = typeof el.fillStyle === "string" && el.fillStyle ? el.fillStyle : "rgba(74, 222, 128, 0.12)";
      const stroke = typeof el.strokeStyle === "string" && el.strokeStyle ? el.strokeStyle : "#4ADE80";
      
      out.push(`      <polygon points="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${px(1.5)}" stroke-linejoin="round"/>`);
      
      if (el.name) {
        let cx = 0, cy = 0;
        for (const p of pts) { cx += p.x; cy += p.y; }
        cx /= pts.length;
        cy /= pts.length;
        out.push(
          `      <text x="${projX(cx)}" y="${projectY(cy)}" text-anchor="middle" dominant-baseline="middle" ` +
          `font-family="sans-serif" font-size="${px(11)}" font-weight="700" ` +
          `fill="#4ADE80" opacity="0.8">${escapeXml(String(el.name))}</text>`
        );
      }
    }
    out.push('    </g>');

    out.push('    <g id="structures" fill="none" stroke-linejoin="round" stroke-linecap="round">');
    for (const { el, kind } of validElements) {
      if (kind === "room" || kind === "raw") continue;

      let stroke = "#64748B";
      let sw = px(2);

      if (kind === "wall") {
        stroke = "#64748B";
        sw = px(2.5);
      } else if (kind === "door") {
        stroke = "#F59E0B";
        sw = px(3);
      } else if (kind === "window") {
        stroke = "#38BDF8";
        sw = px(3.5);
      }

      if (Array.isArray(el.primitives) && el.primitives.length > 0) {
        for (const prim of el.primitives) {
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
            const d = prim.points.map((p: any) => `${projX(p.x)},${projectY(p.y)}`).join(" ");
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

    const byId = new Map<string, DaliDevice>();
    for (const d of devices) byId.set(d.id, d);

    out.push('    <g id="topology" stroke="#475569" fill="none">');
    for (const edge of topology.edges ?? []) {
      const a = byId.get(edge.from);
      const b = byId.get(edge.to);
      const pa = a ? devicePoint(a) : null;
      const pb = b ? devicePoint(b) : null;
      if (!pa || !pb) continue;
      out.push(
        `      <line x1="${projX(pa.x)}" y1="${projectY(pa.y)}" x2="${projX(pb.x)}" y2="${projectY(pb.y)}" ` +
        `stroke-width="${px(1)}"/>`
      );
    }
    out.push('    </g>');

    const deviceGroups = new Map<string, Group[]>();
    for (const d of devices) {
      const gs = (d.groupIds ?? [])
        .map(gid => groups.find(g => g.id === gid))
        .filter(Boolean) as Group[];
      if (gs.length > 0) deviceGroups.set(d.id, gs);
    }

    out.push('    <g id="group-rings" fill="none">');
    for (const d of devices) {
      const pt = devicePoint(d);
      if (!pt) continue;
      const gs = deviceGroups.get(d.id) ?? [];
      gs.forEach((g, i) => {
        const color = g.color || GROUP_PALETTE[Math.abs(hashString(g.id)) % GROUP_PALETTE.length];
        const r = px(11 + i * 2.5);
        out.push(
          `      <circle cx="${projX(pt.x)}" cy="${projectY(pt.y)}" r="${r}" ` +
          `stroke="${color}" stroke-width="${px(1.5)}" opacity="0.8"/>`
        );
      });
    }
    out.push('    </g>');

    out.push('    <g id="devices">');
    for (const { device, pt } of positioned) {
      const color = deviceColor(device);
      const glyph = deviceGlyph(device);
      const r = px(8);

      out.push(
        `      <circle cx="${projX(pt.x)}" cy="${projectY(pt.y)}" r="${r}" ` +
        `fill="${color}" stroke="#0B0F19" stroke-width="${px(1.5)}"/>`
      );

      if (glyph) {
        out.push(
          `      <text x="${projX(pt.x)}" y="${projectY(pt.y) + px(2)}" text-anchor="middle" dominant-baseline="middle" ` +
          `font-family="monospace" font-size="${px(7)}" font-weight="700" fill="#0B0F19">` +
          `${escapeXml(glyph)}</text>`
        );
      }

      const label = device.label || device.id;
      out.push(
        `      <text x="${projX(pt.x)}" y="${projectY(pt.y) - px(13)}" text-anchor="middle" ` +
        `font-family="monospace" font-size="${px(6)}" fill="#E2E8F0">` +
        `${escapeXml(label)}</text>`
      );

      if (device.address != null) {
        out.push(
          `      <text x="${projX(pt.x)}" y="${projectY(pt.y) + px(15)}" text-anchor="middle" ` +
          `font-family="monospace" font-size="${px(5.5)}" fill="#94A3B8">` +
          `@${device.address}</text>`
        );
      }
    }
    out.push('    </g>');

    if (lines.length > 0 && (topology.powerSupplies ?? []).length > 0) {
      out.push('    <g id="power-supplies">');
      for (const ps of topology.powerSupplies ?? []) {
        const lineDevices = devices.filter(d => d.lineId === ps.lineId && devicePoint(d));
        const pts = lineDevices.map(d => devicePoint(d)!).filter(Boolean);
        if (pts.length === 0) continue;
        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        const sz = px(12);

        out.push(
          `      <rect x="${projX(cx) - sz / 2}" y="${projectY(cy) - sz / 2}" width="${sz}" height="${sz}" ` +
          `fill="#A855F7" stroke="#0B0F19" stroke-width="${px(1.5)}"/>`
        );
        out.push(
          `      <text x="${projX(cx)}" y="${projectY(cy) - px(9)}" text-anchor="middle" ` +
          `font-family="monospace" font-size="${px(5.5)}" fill="#A855F7">` +
          `${Math.round(ps.wattage)}W</text>`
        );
      }
      out.push('    </g>');
    }

    out.push('</svg>');

    console.log(
      "[ExportService.downloadSvg]",
      "rawgeometry:", validElements.filter(e => e.kind === "raw").length,
      "rooms:", validElements.filter(e => e.kind === "room").length,
      "walls:", validElements.filter(e => e.kind === "wall").length,
      "doors:", validElements.filter(e => e.kind === "door").length,
      "windows:", validElements.filter(e => e.kind === "window").length,
      "devices:", positioned.length,
      "viewBox:", `0 0 ${width} ${height}`,
    );

    downloadBlob(out.join("\n"), `${safeName}.dali.svg`, "image/svg+xml");
  },
};