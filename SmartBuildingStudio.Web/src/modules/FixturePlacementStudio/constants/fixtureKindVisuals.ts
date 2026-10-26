// src/modules/FixturePlacementStudio/constants/fixtureKindVisuals.ts
//
// Single source of truth for the visual representation of each FixtureKind.
// Used by:
//   - FixtureLibrary    (sidebar palette)
//   - FixtureCanvas     (on-canvas glyphs)
//   - (future) legend overlays, exports, and reports
//
// Colors are grouped by semantic category:
//   - Warm (yellow/orange) — light-emitting and power devices
//   - Cool (blue/cyan)     — sensing and actuation
//   - Violet               — networking and control logic
//   - Red                  — safety-critical

import type { FixtureKind } from '@/modules/FixturePlacementStudio/models/Fixture';

export const KIND_COLORS: Record<FixtureKind, string> = {
  // Fixture kinds — light-emitting
  luminaire: '#FACC15',      // yellow
  emergencyLight: '#EF4444', // red

  // Component kinds — power / control electronics
  driver: '#F97316',         // orange
  powerSupply: '#FB923C',    // light orange

  // Control / sensing kinds
  sensor: '#38BDF8',         // sky blue
  controller: '#A855F7',     // purple
  gateway: '#8B5CF6',        // violet
  switch: '#22D3EE',         // cyan
};

export const KIND_GLYPH: Record<FixtureKind, string> = {
  luminaire: 'L',
  emergencyLight: 'E',
  driver: 'D',
  powerSupply: 'P',
  sensor: 'S',
  controller: 'C',
  gateway: 'G',
  switch: 'W',   // 'S' taken by sensor; 'W' for "wall switch" mnemonic
};

/**
 * Optional human-readable labels. Used in the library for group headers
 * and in inspectors.
 */
export const KIND_LABELS: Record<FixtureKind, string> = {
  luminaire: 'Luminaire',
  emergencyLight: 'Emergency Light',
  driver: 'Driver',
  powerSupply: 'Power Supply',
  sensor: 'Sensor',
  controller: 'Controller',
  gateway: 'Gateway',
  switch: 'Switch',
};

/**
 * Category grouping for library organization.
 */
export type FixtureKindCategory = 'fixtures' | 'components' | 'controls';

export const KIND_CATEGORY: Record<FixtureKind, FixtureKindCategory> = {
  luminaire: 'fixtures',
  emergencyLight: 'fixtures',
  driver: 'components',
  powerSupply: 'components',
  sensor: 'controls',
  controller: 'controls',
  gateway: 'controls',
  switch: 'controls',
};

export const CATEGORY_LABELS: Record<FixtureKindCategory, string> = {
  fixtures: 'Fixtures',
  components: 'Components',
  controls: 'Controls',
};

export default KIND_COLORS;