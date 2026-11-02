// src/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas/utils/pointerMath.ts
//
// Screen↔world math for pointer events. Kept separate from geometry.ts
// because these functions depend on the DOM canvas + DPR, whereas
// geometry.ts is DOM-free.

import type { CanvasTransform } from '../types';

/** Result of reading a React.MouseEvent against a canvas + transform. */
export interface PointerSample {
  /** Canvas-relative screen X, in backing-store pixels (already × DPR). */
  screenX: number;
  /** Canvas-relative screen Y, in backing-store pixels (already × DPR). */
  screenY: number;
  /** World-space X under the pointer. */
  rawWorldX: number;
  /** World-space Y under the pointer. */
  rawWorldY: number;
}

/**
 * Convert a React.MouseEvent into backing-store pixels and world
 * coordinates. Returns null if the canvas or transform is missing.
 *
 * The DPR multiplication matches the existing pointer-handler code:
 * screen coordinates are always expressed in the canvas's backing
 * store, not CSS pixels.
 */
export function samplePointer(
  e: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement | null,
  tf: CanvasTransform | null,
): PointerSample | null {
  if (!canvas || !tf) return null;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const screenX = (e.clientX - rect.left) * dpr;
  const screenY = (e.clientY - rect.top) * dpr;
  return {
    screenX,
    screenY,
    rawWorldX: (screenX - tf.width / 2 - tf.offsetX) / tf.finalScale + tf.centerX,
    rawWorldY: (screenY - tf.height / 2 - tf.offsetY) / tf.yScale + tf.centerY,
  };
}

/**
 * Variant that tolerates a missing canvas/transform and returns
 * zeroes — used by the pointer-up and pointer-leave handlers where
 * we still want to forward the event to the ToolManager even if the
 * transform has been torn down.
 */
export function samplePointerOrZero(
  e: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement | null,
  tf: CanvasTransform | null,
): PointerSample {
  const s = samplePointer(e, canvas, tf);
  if (s) return s;
  return { screenX: 0, screenY: 0, rawWorldX: 0, rawWorldY: 0 };
}

/**
 * Squared distance in screen space between two samples. Used by the
 * drag-rect dead zone check. Squared to avoid a sqrt per move.
 */
export function screenDistSq(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}