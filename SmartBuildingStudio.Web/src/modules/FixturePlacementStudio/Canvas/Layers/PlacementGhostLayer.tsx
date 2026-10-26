// src/modules/FixturePlacementStudio/Canvas/Layers/PlacementLayer.ts
//
// Draws the placement ghost — a dashed outline plus crosshair that
// follows the cursor while a product is selected for placement. The
// ghost is skipped when placement mode is inactive.
//
// This is the DRAW layer for placement, not the placement hook. The
// hook lives in Canvas/PlacementLayer.ts.

import type { ViewportLike } from '@/modules/Shared/Canvas/Transform';
import { FIXTURE_RADIUS_PX } from './FixtureLayer';

export function drawPlacementGhostLayer(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportLike,
  cursor: { worldX: number; worldY: number }
): void {
  const p = viewport.worldToScreen({ x: cursor.worldX, y: cursor.worldY });

  ctx.beginPath();
  ctx.arc(p.x, p.y, FIXTURE_RADIUS_PX, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.fill();
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(p.x - 12, p.y);
  ctx.lineTo(p.x + 12, p.y);
  ctx.moveTo(p.x, p.y - 12);
  ctx.lineTo(p.x, p.y + 12);
  ctx.stroke();
}

export default drawPlacementGhostLayer;