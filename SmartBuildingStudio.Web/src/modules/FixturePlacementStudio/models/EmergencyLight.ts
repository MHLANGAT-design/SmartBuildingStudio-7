// src/modules/FixturePlacementStudio/models/EmergencyLight.ts
//
// Kind-specific payload for an emergency light fixture instance.
//
// Emergency lighting has its own compliance concepts — maintained vs
// non-maintained operation, autonomy duration, escape-route
// classification. These are per-instance only when they differ from the
// product's defaults.

export type EmergencyOperationMode = 'maintained' | 'non-maintained' | 'combined' | 'unknown';

export type EmergencyClassification =
  | 'escape-route'
  | 'open-area'
  | 'high-risk-task'
  | 'exit-sign'
  | 'unknown';

export interface EmergencyLight {
  /** Maintained (always on) vs non-maintained (only on power loss). */
  operationMode?: EmergencyOperationMode;

  /**
   * Autonomy in minutes. Common values: 60, 90, 120, 180. The product
   * catalog defines a default; this field overrides only when the
   * installation requires it.
   */
  autonomyMinutes?: number;

  /** Compliance classification driving placement rules and validation. */
  classification?: EmergencyClassification;

  /**
   * Escape-route flag. True when this instance is intended to serve a
   * designated escape route. Placement validation checks that escape
   * routes are covered before sign-off.
   */
  onEscapeRoute?: boolean;

  /** Free-form per-instance override of catalog defaults. */
  overrides?: Record<string, unknown>;
}

export default EmergencyLight;