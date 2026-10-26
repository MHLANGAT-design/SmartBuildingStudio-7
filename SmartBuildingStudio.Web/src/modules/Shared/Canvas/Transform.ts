// src/modules/Shared/Canvas/Transform.ts
//
// Shared coordinate-transform math for canvas workspaces.
//
// FloorPlanDesigner and FixturePlacementStudio both need to map world
// coordinates to canvas pixels and back. They MUST agree on this math —
// otherwise the same fixture appears in a different place depending on
// which editor is open. Extracting it here is a shared contract, not
// coupling: there is no state, no hooks, no Redux.
//
// The transform is:
//
//   screenX = width/2  + offsetX + (worldX - centerX) * finalScale
//   screenY = height/2 + offsetY + (worldY - centerY) * yScale
//
// where finalScale fits the document bounds into the canvas with a
// padding margin, multiplied by the user's zoom factor. yScale is the
// same magnitude as finalScale but negated when flipY is true, which
// matches the drawing convention used by CanvasRenderer.

export interface ViewTransform {
  finalScale: number;
  yScale: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export interface ViewportLike {
  worldToScreen(world: { x: number; y: number }): { x: number; y: number };
  screenToWorld(screen: { x: number; y: number }): { x: number; y: number };
}

export interface ComputeTransformArgs {
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  /** Padding in pixels inside the canvas on each side. Default 60. */
  padding?: number;
  /** Flip Y so that positive Y points up. Default true. */
  flipY?: boolean;
}

export function computeViewTransform(args: ComputeTransformArgs): ViewTransform {
  const padding = args.padding ?? 60;
  const flipY = args.flipY ?? true;

  const bounds = args.bounds;
  const dxfWidth = Math.max(1, bounds.maxX - bounds.minX);
  const dxfHeight = Math.max(1, bounds.maxY - bounds.minY);

  const fitScale =
    Math.min(
      (args.canvasWidth - 2 * padding) / dxfWidth,
      (args.canvasHeight - 2 * padding) / dxfHeight
    ) * (args.zoom || 1);

  const yScale = flipY ? -fitScale : fitScale;

  return {
    finalScale: fitScale,
    yScale,
    centerX: (bounds.minX + bounds.maxX) / 2,
    centerY: (bounds.minY + bounds.maxY) / 2,
    width: args.canvasWidth,
    height: args.canvasHeight,
    offsetX: args.offsetX,
    offsetY: args.offsetY,
  };
}

export function makeViewport(tf: ViewTransform): ViewportLike {
  return {
    worldToScreen(wp) {
      return {
        x: tf.width / 2 + tf.offsetX + (wp.x - tf.centerX) * tf.finalScale,
        y: tf.height / 2 + tf.offsetY + (wp.y - tf.centerY) * tf.yScale,
      };
    },
    screenToWorld(sp) {
      return {
        x: (sp.x - tf.width / 2 - tf.offsetX) / tf.finalScale + tf.centerX,
        y: (sp.y - tf.height / 2 - tf.offsetY) / tf.yScale + tf.centerY,
      };
    },
  };
}

/**
 * Compute the bounding box of a set of world points. Returns a fallback
 * box when no valid points are given.
 */
export function computeBounds(
  points: ReadonlyArray<{ x: number; y: number } | undefined | null>,
  fallback = { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 }
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  let hasAny = false;

  for (const p of points) {
    if (!p) continue;
    if (typeof p.x !== 'number' || typeof p.y !== 'number') continue;
    if (!isFinite(p.x) || !isFinite(p.y)) continue;
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    hasAny = true;
  }

  if (!hasAny) return fallback;
  return { minX, minY, maxX, maxY };
}