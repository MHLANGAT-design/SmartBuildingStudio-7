// src/modules/FixturePlacementStudio/Canvas/Layers/SnapLayer.ts
//
// Placeholder for a future snap-indicator overlay. Currently a no-op:
// the slice has no snap state, and FixtureCanvas does not compute snap
// targets yet. When snap support lands, this file renders the snap
// marker at the active snap point.
//
// Keeping the layer wired into FixtureCanvas means adding snap later is
// a matter of filling in this file and threading a snap state through
// the slice — no changes to the canvas host.

import type { ViewportLike } from '@/modules/Shared/Canvas/Transform';

export interface SnapTarget {
  x: number;
  y: number;
  kind: 'grid' | 'fixture' | 'room' | 'wall';
}

export function drawSnapLayer(
  _ctx: CanvasRenderingContext2D,
  _viewport: ViewportLike,
  _snapTarget: SnapTarget | null
): void {
  // Intentionally empty until snap support exists.
}

export default drawSnapLayer;