// src/modules/FixturePlacementStudio/Canvas/Layers/ZoneLayer.ts
//
// Draws a circular envelope around each zone's member fixtures, with
// the zone name centered. Zones with fewer than two members are skipped
// — a single point has no meaningful envelope.

import type { Fixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import type { Zone } from '@/modules/FixturePlacementStudio/models/Zone';
import type { ViewportLike } from '@/modules/Shared/Canvas/Transform';

export function drawZoneLayer(
  ctx: CanvasRenderingContext2D,
  zones: Zone[],
  fixtures: Fixture[],
  viewport: ViewportLike,
  selectedZoneIds: string[]
): void {
  if (zones.length === 0) return;

  const selectedSet = new Set(selectedZoneIds);

  for (const zone of zones) {
    const members = fixtures.filter((f) => zone.memberFixtureIds.includes(f.id));
    if (members.length < 2) continue;

    let cx = 0;
    let cy = 0;
    for (const m of members) {
      cx += m.x;
      cy += m.y;
    }
    cx /= members.length;
    cy /= members.length;

    let maxDist = 0;
    for (const m of members) {
      const d = Math.hypot(m.x - cx, m.y - cy);
      if (d > maxDist) maxDist = d;
    }
    const radius = Math.max(maxDist * 1.5, 500);

    const center = viewport.worldToScreen({ x: cx, y: cy });
    const edge = viewport.worldToScreen({ x: cx + radius, y: cy });
    const screenRadius = Math.abs(edge.x - center.x);

    const selected = selectedSet.has(zone.id);

    ctx.beginPath();
    ctx.arc(center.x, center.y, screenRadius, 0, Math.PI * 2);
    ctx.fillStyle = selected
      ? 'rgba(56, 189, 248, 0.12)'
      : 'rgba(74, 222, 128, 0.05)';
    ctx.fill();
    ctx.strokeStyle = selected ? '#38BDF8' : 'rgba(74, 222, 128, 0.35)';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = selected ? '#38BDF8' : 'rgba(74, 222, 128, 0.7)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(zone.name.toUpperCase(), center.x, center.y);
  }
}

export default drawZoneLayer;