// src/modules/FixturePlacementStudio/Canvas/Layers/RoomLayer.ts
//
// Draws room fills, outlines, and labels from the DrawingDocument's
// room elements. This layer is skipped when no drawingDocument is
// loaded.
//
// Selected-room highlight (5th arg):
//   When `selectedRoomId` is provided, that room's polygon is drawn on
//   top of every other room with a bright cyan fill + outline. This is
//   purely additive — the base pass and labels are unchanged.

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
  tf: ViewTransform,
  selectedRoomId?: string | null
): void {
  if (!drawingDocument) return;
  const elements = drawingDocument.getElements();
  if (!elements || elements.length === 0) return;

  const rooms = elements.filter((el: any) => {
    const t = String(el?.type ?? '').toLowerCase();
    return t === 'room' || t === 'rooms' || el?.isRoom === true;
  });
  if (rooms.length === 0) return;

  // ── Pass 1: fills + outlines in world space ─────────────────────
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

  // ── Pass 2: selected-room highlight (world space, on top) ───────
  // Drawn inside the same world transform so the polygon lines up
  // exactly with the base fill even when zoomed/panned.
  if (selectedRoomId) {
    const selected = rooms.find((r: any) => {
      const id = String(r?.id ?? r?.Id ?? '');
      return id === selectedRoomId;
    });

    if (selected) {
      const pts: { x: number; y: number }[] =
        selected.points || selected.vertices || [];
      if (Array.isArray(pts) && pts.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();

        // Bright cyan fill
        ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.fill();

        // Solid outline
        ctx.lineWidth = 2 / tf.finalScale;
        ctx.strokeStyle = '#38BDF8';
        ctx.setLineDash([]);
        ctx.stroke();

        // Inner dashed hairline for a "focus ring" effect
        ctx.lineWidth = 1 / tf.finalScale;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
        ctx.setLineDash([6 / tf.finalScale, 4 / tf.finalScale]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  ctx.restore();

  // ── Pass 3: labels in screen space ──────────────────────────────
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

    const isSelected =
      !!selectedRoomId &&
      String((room as any)?.id ?? (room as any)?.Id ?? '') === selectedRoomId;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 4;

    ctx.fillStyle = isSelected ? '#38BDF8' : 'rgba(74, 222, 128, 0.95)';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(name.toUpperCase(), screen.x, screen.y - 12);

    ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.85)' : 'rgba(255, 255, 255, 0.65)';
    ctx.font = '9px monospace';
    ctx.fillText(`${targetLux} lx  |  G${primaryGroup}`, screen.x, screen.y + 2);

    ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.65)' : 'rgba(255, 255, 255, 0.45)';
    ctx.fillText(`${areaM2.toFixed(2)} m²`, screen.x, screen.y + 14);

    ctx.restore();
  }
}

export default drawRoomLayer;