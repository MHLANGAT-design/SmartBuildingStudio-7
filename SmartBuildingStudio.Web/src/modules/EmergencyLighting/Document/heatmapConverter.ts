// src/modules/EmergencyLighting/Document/heatmapConverter.ts

import type {
  FixtureLayout,
} from '@/modules/FixturePlacementStudio/models/FixtureLayout';
import type {
  Fixture,
  FixtureKind,
} from '@/modules/FixturePlacementStudio/models/Fixture';
import { createFixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import type { WallSegment } from '@/modules/FixturePlacementStudio/services/PhotometricService';
import { extractWallSegments } from '@/modules/FixturePlacementStudio/services/PhotometricService';

/**
 * Map an EmergencyLighting fixture element to an FPS Fixture.
 * EmergencyLighting fixtures use `kind` and `type` interchangeably;
 * FPS expects one of its eight fixture kinds. Any "emergency" hint
 * becomes 'emergencyLight'; everything else becomes 'luminaire'.
 */
function mapFixtureKind(raw: any): FixtureKind {
  const candidates = [
    raw?.kind, raw?.sourceKind, raw?.type, raw?.fixtureType,
    raw?.metadata?.sourceKind, raw?.metadata?.kind,
  ];
  for (const c of candidates) {
    if (typeof c !== 'string') continue;
    const s = c.toLowerCase().replace(/[_\s-]/g, '');
    if (s.includes('emergency')) return 'emergencyLight';
  }
  return 'luminaire';
}

/**
 * Map the EmergencyLighting floorplan model into an FPS FixtureLayout.
 * Only fixtures with a finite x,y are included. Fixtures without a
 * productId are assigned a synthetic id so the photometric resolver can
 * fall back to the stub distribution (see PhotometricService's
 * createStubDistributionResolver).
 */
export function convertToFixtureLayout(
  model: any,
  documentId: string
): FixtureLayout {
  const rawFixtures: any[] = Array.isArray(model?.electricalFixtures)
    ? model.electricalFixtures
    : [];

  const fixtures: Fixture[] = [];
  for (const raw of rawFixtures) {
    const x = Number(raw?.x ?? raw?.position?.x);
    const y = Number(raw?.y ?? raw?.position?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

    const kind = mapFixtureKind(raw);
    const id = String(raw?.id ?? `em-fx-${fixtures.length}`);
    const productId =
      String(raw?.productId ?? raw?.ProductId ?? '') ||
      `__stub_${kind}`; // triggers stub resolver in PhotometricService

    const fixture = createFixture(kind, {
      id,
      productId,
      documentId,
      x,
      y,
      rotation: Number(raw?.rotation ?? 0),
      roomId: raw?.roomId ?? undefined,
      elevation: Number(raw?.elevation ?? 0),
    });
    fixtures.push(fixture);
  }

  return {
    documentId,
    revision: 0,
    fixtures,
    zones: [],
    calculations: [],
    selectedFixtureIds: [],
    selectedZoneIds: [],
    dirty: false,
  };
}

/**
 * Extract wall/door/window segments from the floorplan model's elements
 * using FPS's built-in extractor. Pass-through is fine here — the FPS
 * helper already treats doors and windows as opaque for illuminance
 * purposes, which is correct for visibility/heatmap but not for route
 * crossing (ComplianceEngine handles those separately).
 */
export function extractBarriers(model: any): WallSegment[] {
  const elements: any[] = Array.isArray(model?.elements) ? model.elements : [];
  return extractWallSegments(elements);
}