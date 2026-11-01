// src/modules/EmergencyLighting/Canvas/EmergencyCanvas/projection.ts

import { makeSafeWorldToScreen } from './geometry';
import type { Pt, WorldToScreen } from './geometry';

export interface Projection {
  finalScale: number;
  dxfWidth: number;
  dxfHeight: number;
  centerX: number;
  centerY: number;
  yScale: number;
  dpr: number;
  worldToScreen: WorldToScreen;
  worldToScreenRaw: WorldToScreen;
  screenToWorld: WorldToScreen;
}

export interface BuildProjectionArgs {
  combinedModel: { elements: any[]; doors?: any[] } | null;
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
  offset: Pt;
}

export function buildProjection({
  combinedModel,
  canvasWidth,
  canvasHeight,
  scale,
  offset,
}: BuildProjectionArgs): Projection | null {
  if (!combinedModel) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let hasPoints = false;

  const processPoint = (pt: Pt) => {
    if (pt && typeof pt.x === 'number' && typeof pt.y === 'number') {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
      hasPoints = true;
    }
  };

  for (const el of combinedModel.elements) {
    const pts = el.points || el.vertices || (el.start && el.end ? [el.start, el.end] : []);
    if (Array.isArray(pts)) pts.forEach(processPoint);
    if (typeof el.x === 'number' && typeof el.y === 'number') {
      processPoint({ x: el.x, y: el.y });
    }
  }
  for (const d of combinedModel.doors || []) {
    processPoint({ x: d.hingeX, y: d.hingeY });
  }
  if (!hasPoints) return null;

  const dxfWidth = maxX - minX || 1;
  const dxfHeight = maxY - minY || 1;
  const finalScale =
    Math.min((canvasWidth - 120) / dxfWidth, (canvasHeight - 120) / dxfHeight) *
    (scale || 1);
  if (finalScale <= 0) return null;

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const yScale = -finalScale;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const worldToScreenRaw: WorldToScreen = (p: Pt) => ({
    x: canvasWidth / 2 + offset.x * dpr + (p.x - centerX) * finalScale,
    y: canvasHeight / 2 + offset.y * dpr + (p.y - centerY) * yScale,
  });

  const screenToWorld: WorldToScreen = (p: Pt) => ({
    x: (p.x - canvasWidth / 2 - offset.x * dpr) / finalScale + centerX,
    y: (p.y - canvasHeight / 2 - offset.y * dpr) / yScale + centerY,
  });

  const worldToScreen = makeSafeWorldToScreen(worldToScreenRaw);

  return {
    finalScale,
    dxfWidth,
    dxfHeight,
    centerX,
    centerY,
    yScale,
    dpr,
    worldToScreen,
    worldToScreenRaw,
    screenToWorld,
  };
}