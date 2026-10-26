// src/modules/FixturePlacementStudio/models/Luminaire.ts
//
// Kind-specific payload for a luminaire fixture instance.
//
// This is NOT the product definition — the product definition lives in
// ProductCatalogService and is referenced by `Fixture.productId`. This
// payload carries only the per-instance data that a luminaire has beyond
// the common FixtureBase envelope: things like control group assignment,
// dimming curve selection, and mounting orientation.

export type LuminaireMounting = 'recessed' | 'surface' | 'suspended' | 'wall' | 'track' | 'unknown';

export type DimmingProtocol = 'DALI' | 'DALI-2' | '0-10V' | 'DMX' | 'mains' | 'unknown';

/**
 * Per-instance luminaire data. Anything that comes from the catalog
 * (lumen output, CCT, beam angle, etc.) lives in ProductCatalogService
 * and is looked up by productId — not duplicated here.
 */
export interface Luminaire {
  /** Mounting style for this instance. May override catalog default. */
  mounting?: LuminaireMounting;

  /** Control protocol expected at this fixture. */
  dimmingProtocol?: DimmingProtocol;

  /**
   * Lighting group / zone assignment. Optional at the model level — the
   * authoritative zone membership is expressed by Zone.memberFixtureIds.
   * This field is a convenience back-reference that FixturePlacementStudio
   * keeps in sync.
   */
  lightingGroup?: number;

  /**
   * Aim orientation (for directional fixtures). Rotation in radians
   * about the vertical axis, measured the same way as Fixture.rotation
   * but stored separately because some fixtures have separate body and
   * aim angles (e.g. adjustable spots).
   */
  aimAngle?: number;

  /** Tilt angle in radians from vertical. 0 = straight down. */
  tiltAngle?: number;

  /** Free-form per-instance override of catalog defaults. */
  overrides?: Record<string, unknown>;
}

export default Luminaire;