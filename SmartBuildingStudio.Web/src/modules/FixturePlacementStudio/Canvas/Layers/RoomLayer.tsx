// src/modules/FixturePlacementStudio/Canvas/Layers/RoomLayer.ts
//
// Draws room fills, outlines, and labels from the DrawingDocument's
// room elements. This layer is skipped when no drawingDocument is
// loaded.

import type { DrawingDocument } from '@/modules/FloorPlanDesigner/Document/DrawingDocument';
import type {
  ViewTransform,
  ViewportLike,
} from '@/modules/Shared/Canvas/Transform';

function calculateAreaFromPoints(points: { x: number; y: number }[]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2 / 1000000;
}

export function drawRoomLayer(
  ctx: CanvasRenderingContext2D,
  drawingDocument: DrawingDocument | null,
  viewport: ViewportLike,
  tf: ViewTransform
): void {
  if (!drawingDocument) return;
  const elements = drawingDocument.getElements();
  if (!elements || elements.length === 0) return;

  const rooms = elements.filter((el: any) => {
    const t = String(el?.type ?? '').toLowerCase();
    return t === 'room' || t === 'rooms' || el?.isRoom === true;
  });
  if (rooms.length === 0) return;

  // ── Fills + outlines in world space ─────────────────────────────
  ctx.save();
  ctx.translate(tf.width / 2 + tf.offsetX, tf.height / 2 + tf.offsetY);
  ctx.scale(tf.finalScale, tf.yScale);
  ctx.translate(-tf.centerX, -tf.centerY);

  for (const room of rooms) {
    const pts: { x: number; y: number }[] = room.points || room.vertices || [];
    if (!Array.isArray(pts) || pts.length < 3) continue;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();

    ctx.fillStyle = (room as any).fillStyle || 'rgba(74, 222, 128, 0.10)';
    ctx.fill();

    ctx.strokeStyle = (room as any).strokeStyle || 'rgba(74, 222, 128, 0.65)';
    ctx.lineWidth = 1.5 / tf.finalScale;
    ctx.setLineDash([]);
    ctx.stroke();
  }
  ctx.restore();

  // ── Labels in screen space ──────────────────────────────────────
  for (const room of rooms) {
    const pts: { x: number; y: number }[] = room.points || room.vertices || [];
    if (!Array.isArray(pts) || pts.length < 3) continue;

    let cx = 0;
    let cy = 0;
    for (const p of pts) {
      cx += p.x;
      cy += p.y;
    }
    cx /= pts.length;
    cy /= pts.length;

    const screen = viewport.worldToScreen({ x: cx, y: cy });

    const name = String((room as any).name || 'Unnamed Room');
    const targetLux = Number((room as any).targetLux ?? (room as any).lux ?? 500);
    const primaryGroup = Number(
      (room as any).primaryGroup ?? (room as any).group ?? 1
    );
    const areaM2 = calculateAreaFromPoints(pts);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 4;

    ctx.fillStyle = 'rgba(74, 222, 128, 0.95)';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(name.toUpperCase(), screen.x, screen.y - 12);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '9px monospace';
    ctx.fillText(`${targetLux} lx  |  G${primaryGroup}`, screen.x, screen.y + 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillText(`${areaM2.toFixed(2)} m²`, screen.x, screen.y + 14);

    ctx.restore();
  }
}

export default drawRoomLayer;