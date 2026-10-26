// src/modules/FixturePlacementStudio/index.ts
//
// Public surface of the FixturePlacementStudio module.
//
// Only what outside modules need is exported here. Everything else is
// internal to the module.

export { default as FixturePlacementStudioPage } from '@/modules/FixturePlacementStudio/FixturePlacementStudioPage';

// Re-export the models so other modules (DALIDesigner, Reports) can
// reference the fixture types without reaching into internals.
export type { Fixture, FixtureKind } from '@/modules/FixturePlacementStudio/models/Fixture';
export type { Zone, ZoneKind, ZoneMode } from '@/modules/FixturePlacementStudio/models/Zone';
export type { FixtureLayout } from '@/modules/FixturePlacementStudio/models/FixtureLayout';
export type { LightingCalculation } from '@/modules/FixturePlacementStudio/models/LightingCalculation';
export type { PhotometricData } from '@/modules/FixturePlacementStudio/models/PhotometricData';
export type { PlacementRule } from '@/modules/FixturePlacementStudio/models/PlacementRule';

// Session lifecycle — exposed so the Page can dispose on unmount and
// tests can reset between cases.
export { SessionRegistry } from '@/modules/FixturePlacementStudio/store/SessionRegistry';

// Photometric resolver override — the single hook for wiring
// ProductCatalogService once it exists.
export { setPhotometricResolver } from '@/modules/FixturePlacementStudio/store/fixtureSelectors';