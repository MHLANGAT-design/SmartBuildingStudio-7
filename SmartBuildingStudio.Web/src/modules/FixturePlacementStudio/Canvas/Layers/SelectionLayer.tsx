// src/modules/FixturePlacementStudio/Canvas/Layers/SelectionLayer.ts
//
// Draws the drag preview for the fixture currently being dragged.
// Fixture selection highlight is drawn inline by FixtureLayer; this
// layer is only active during a drag.

import type { Fixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import type { ViewportLike } from '@/modules/Shared/Canvas/Transform';
import {
  KIND_COLORS,
  KIND_GLYPH,
} from '@/modules/FixturePlacementStudio/constants/fixtureKindVisuals';
import { FIXTURE_RADIUS_PX } from './FixtureLayer';

export function drawSelectionLayer(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportLike,
  fixture: Fixture,
  worldX: number,
  worldY: number
): void {
  const p = viewport.worldToScreen({ x: worldX, y: worldY });

  ctx.beginPath();
  ctx.arc(p.x, p.y, FIXTURE_RADIUS_PX + 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.20)';
  ctx.fill();
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(p.x, p.y, FIXTURE_RADIUS_PX, 0, Math.PI * 2);
  ctx.fillStyle = KIND_COLORS[fixture.kind];
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#0A0A0A';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(KIND_GLYPH[fixture.kind], p.x, p.y + 0.5);
}

export default drawSelectionLayer;