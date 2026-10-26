// src/modules/FixturePlacementStudio/Canvas/Layers/MeasurementLayer.ts
//
// Placeholder for a future measurement overlay. Currently a no-op:
// there is no measurement data source yet, so this layer renders
// nothing regardless of the toggle state.
//
// When measurement support lands, replace the body with the actual
// rendering. The signature is already wired into FixtureCanvas so
// nothing else will need to change.

import type { ViewportLike } from '@/modules/Shared/Canvas/Transform';

export interface MeasurementData {
  // Define when the feature exists. For now, this type is empty so
  // that the signature is stable.
  points: ReadonlyArray<{ x: number; y: number }>;
}

export function drawMeasurementLayer(
  _ctx: CanvasRenderingContext2D,
  _viewport: ViewportLike,
  _measurements: MeasurementData | null
): void {
  // Intentionally empty. Layer is toggleable but has no visual output
  // until a measurement data source exists.
}

export default drawMeasurementLayer;