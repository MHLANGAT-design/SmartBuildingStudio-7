// src/modules/FixturePlacementStudio/Canvas/Layers/GridLayer.ts
//
// Draws the fallback background grid. Rendered only when no plan is
// loaded — the plan (walls/doors/windows/rooms) replaces the grid as
// the visual anchor when a document is present.

import type { ViewTransform } from '@/modules/Shared/Canvas/Transform';

export function drawGridLayer(
  ctx: CanvasRenderingContext2D,
  tf: ViewTransform
): void {
  const minorSpacing = 50;
  const majorSpacing = 500;

  const left = tf.centerX - tf.width / 2 / tf.finalScale;
  const right = tf.centerX + tf.width / 2 / tf.finalScale;
  const top = tf.centerY - tf.height / 2 / Math.abs(tf.yScale);
  const bottom = tf.centerY + tf.height / 2 / Math.abs(tf.yScale);

  const worldToScreen = (wp: { x: number; y: number }) => ({
    x: tf.width / 2 + tf.offsetX + (wp.x - tf.centerX) * tf.finalScale,
    y: tf.height / 2 + tf.offsetY + (wp.y - tf.centerY) * tf.yScale,
  });

  const drawLines = (spacing: number, color: string, lineWidth: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    const startX = Math.floor(left / spacing) * spacing;
    const endX = Math.ceil(right / spacing) * spacing;
    for (let x = startX; x <= endX; x += spacing) {
      const s1 = worldToScreen({ x, y: top });
      const s2 = worldToScreen({ x, y: bottom });
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
    }

    const startY = Math.floor(top / spacing) * spacing;
    const endY = Math.ceil(bottom / spacing) * spacing;
    for (let y = startY; y <= endY; y += spacing) {
      const s1 = worldToScreen({ x: left, y });
      const s2 = worldToScreen({ x: right, y });
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
    }
    ctx.stroke();
  };

  drawLines(minorSpacing, 'rgba(30, 41, 59, 0.35)', 1);
  drawLines(majorSpacing, 'rgba(51, 65, 85, 0.7)', 1.5);
}

export default drawGridLayer;