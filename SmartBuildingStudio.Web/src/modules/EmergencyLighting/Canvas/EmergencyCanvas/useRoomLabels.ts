// src/modules/EmergencyLighting/Canvas/EmergencyCanvas/useRoomLabels.ts

import { useEffect } from 'react';
import { computeArea, isSentinel } from './geometry';
import type { Projection } from './projection';

export interface DrawRoomLabelsArgs {
  canvas: HTMLCanvasElement | null;
  combinedModel: { elements: any[] } | null;
  proj: Projection | null;
  roomsVisible: boolean;
}

export function useRoomLabels({
  canvas,
  combinedModel,
  proj,
  roomsVisible,
}: DrawRoomLabelsArgs) {
  useEffect(() => {
    if (!canvas || !combinedModel || !proj || !roomsVisible) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!Array.isArray(combinedModel.elements) || combinedModel.elements.length === 0) return;

    const { worldToScreen } = proj;

    const maxFont = Math.max(10, Math.min(14, canvas.width / 100));
    const fontSize = Math.max(8, Math.min(maxFont, 14));
    const lineHeight = fontSize * 1.2;

    for (const element of combinedModel.elements) {
      const type = String(element.type || '').toLowerCase();
      if (type !== 'room' && type !== 'rooms' && element.isRoom !== true) continue;

      const pts = element.points || element.vertices || [];
      if (!Array.isArray(pts) || pts.length < 3) continue;

      let cx = 0;
      let cy = 0;
      for (const p of pts) {
        cx += p.x;
        cy += p.y;
      }
      cx /= pts.length;
      cy /= pts.length;

      const screenC = worldToScreen({ x: cx, y: cy });
      if (isSentinel(screenC)) continue;

      const areaValue = computeArea(pts);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = 'rgba(74, 222, 128, 0.95)';
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillText(element.name || 'Unnamed Room', screenC.x, screenC.y - lineHeight * 0.6);

      const lux = element.targetLux || element.lux || 500;
      const group = element.primaryGroup || element.group || 1;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = `${fontSize * 0.8}px sans-serif`;
      ctx.fillText(`${lux} lx  |  G${group}`, screenC.x, screenC.y + lineHeight * 0.4);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = `${fontSize * 0.7}px sans-serif`;
      ctx.fillText(`${areaValue.toFixed(1)} m²`, screenC.x, screenC.y + lineHeight * 1.1);

      ctx.restore();
    }
  }, [canvas, combinedModel, proj, roomsVisible]);
}