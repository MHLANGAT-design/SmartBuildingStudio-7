// src/modules/EmergencyLighting/Canvas/EmergencyCanvas/index.ts
//
// Barrel — absolute-path re-exports so every consumer can import the
// component and its helpers from one canonical location:
//   import { EmergencyCanvas } from '@/modules/EmergencyLighting/Canvas/EmergencyCanvas';
//
// If your bundler's resolver honours tsconfig `paths` and you have the
// `@/*` alias mapped to `src/*`, you can also use the relative paths
// below — they resolve identically either way. Absolute form is used here
// for clarity and cross-refactor safety.

export {
  EmergencyCanvas,
  default,
} from '@/modules/EmergencyLighting/Canvas/EmergencyCanvas/EmergencyCanvas';

export type { Projection } from '@/modules/EmergencyLighting/Canvas/EmergencyCanvas/projection';
export { buildProjection } from '@/modules/EmergencyLighting/Canvas/EmergencyCanvas/projection';

export type {
  Pt,
  WorldToScreen,
} from '@/modules/EmergencyLighting/Canvas/EmergencyCanvas/geometry';

export {
  makeSafeWorldToScreen,
  isSentinel,
  pointToSegmentPx,
  computeArea,
  getPoints,
  dropOutliers,
  MIN_CANVAS_DIM,
  ROUTE_HIT_TOLERANCE_PX,
  OUTLIER_RADIUS,
  SENTINEL_X,
  SENTINEL_Y,
} from '@/modules/EmergencyLighting/Canvas/EmergencyCanvas/geometry';

export { useCombinedModel } from '@/modules/EmergencyLighting/Canvas/EmergencyCanvas/useCombinedModel';
export { useCanvasSize } from '@/modules/EmergencyLighting/Canvas/EmergencyCanvas/useCanvasSize';
export { useRoomLabels } from '@/modules/EmergencyLighting/Canvas/EmergencyCanvas/useRoomLabels';
export { DetailRow } from '@/modules/EmergencyLighting/Canvas/EmergencyCanvas/DetailRow';