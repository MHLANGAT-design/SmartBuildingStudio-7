// src/modules/FixturePlacementStudio/Canvas/Layers/FixtureLayer.ts
//
// Draws the fixture glyphs (colored circle + monogram). The dragged
// fixture is excluded here and drawn separately by the SelectionLayer
// as a preview at the drag position.

import type { Fixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import type { ViewportLike } from '@/modules/Shared/Canvas/Transform';
import {
  KIND_COLORS,
  KIND_GLYPH,
} from '@/modules/FixturePlacementStudio/constants/fixtureKindVisuals';

export const FIXTURE_RADIUS_PX = 6;

export function drawFixtureLayer(
  ctx: CanvasRenderingContext2D,
  fixtures: Fixture[],
  viewport: ViewportLike,
  selectedSet: Set<string>
): void {
  for (const f of fixtures) {
    const p = viewport.worldToScreen({ x: f.x, y: f.y });
    const selected = selectedSet.has(f.id);

    if (selected) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, FIXTURE_RADIUS_PX + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, FIXTURE_RADIUS_PX, 0, Math.PI * 2);
    ctx.fillStyle = KIND_COLORS[f.kind];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#0A0A0A';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(KIND_GLYPH[f.kind], p.x, p.y + 0.5);
  }
}

export default drawFixtureLayer;