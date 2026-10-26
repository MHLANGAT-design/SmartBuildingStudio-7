// src/modules/FixturePlacementStudio/store/fixtureSelectors.ts
//
// Memoized selectors for FixturePlacementStudio.
//
// Selectors that reach into the SessionRegistry return non-serializable
// objects (FixtureDocument, FixtureHistory). These are read-only — the
// caller must not mutate. The slice owns all mutations.
//
// PhotometricService is exposed via a module-level singleton so thunks
// don't need to construct it repeatedly. The resolver is swappable via
// setPhotometricResolver.

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/Application/ConfigureStore';
import type { FixtureLayout } from '@/modules/FixturePlacementStudio/models/FixtureLayout';
import type { Fixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import type { Zone } from '@/modules/FixturePlacementStudio/models/Zone';
import type { LightingCalculation } from '@/modules/FixturePlacementStudio/models/LightingCalculation';
import type { FixtureSliceState } from '@/modules/FixturePlacementStudio/store/fixtureTypes';
import type {
  LayerKey,
  LayerVisibility,
} from '@/modules/FixturePlacementStudio/store/fixtureSlice';
import { DEFAULT_LAYER_VISIBILITY } from '@/modules/FixturePlacementStudio/store/fixtureSlice';
import { SessionRegistry } from '@/modules/FixturePlacementStudio/store/SessionRegistry';
import {
  PhotometricService,
  createStubDistributionResolver,
  type PhotometricDistributionResolver,
} from '@/modules/FixturePlacementStudio/services/PhotometricService';

// ─── Base selectors ───────────────────────────────────────────────────────────

export const selectFixtureState = (state: RootState): FixtureSliceState =>
  (state as any).fixture as FixtureSliceState;

export const selectLayout = createSelector(
  [selectFixtureState],
  (slice): FixtureLayout | null => slice.layout
);

export const selectFixtures = createSelector(
  [selectLayout],
  (layout): Fixture[] => layout?.fixtures ?? []
);

export const selectZones = createSelector(
  [selectLayout],
  (layout): Zone[] => layout?.zones ?? []
);

export const selectSelectedFixtureIds = createSelector(
  [selectFixtureState],
  (slice) => slice.selectedFixtureIds
);

export const selectSelectedZoneIds = createSelector(
  [selectFixtureState],
  (slice) => slice.selectedZoneIds
);

export const selectSelectedFixtures = createSelector(
  [selectFixtures, selectSelectedFixtureIds],
  (fixtures, ids): Fixture[] => {
    const idSet = new Set(ids);
    return fixtures.filter((f) => idSet.has(f.id));
  }
);

export const selectSelectedZones = createSelector(
  [selectZones, selectSelectedZoneIds],
  (zones, ids): Zone[] => {
    const idSet = new Set(ids);
    return zones.filter((z) => idSet.has(z.id));
  }
);

export const selectDocumentId = createSelector(
  [selectFixtureState],
  (slice) => slice.documentId
);

export const selectLoadStatus = createSelector(
  [selectFixtureState],
  (slice) => slice.loadStatus
);

export const selectLoadError = createSelector(
  [selectFixtureState],
  (slice) => slice.loadError
);

export const selectSaveStatus = createSelector(
  [selectFixtureState],
  (slice) => slice.saveStatus
);

export const selectSaveError = createSelector(
  [selectFixtureState],
  (slice) => slice.saveError
);

export const selectConflict = createSelector(
  [selectFixtureState],
  (slice) => slice.conflict
);

export const selectIsDirty = createSelector(
  [selectFixtureState],
  (slice) => slice.dirty
);

export const selectRunningCalculation = createSelector(
  [selectFixtureState],
  (slice) => slice.runningCalculation
);

export const selectLatestCalculation = (kind: LightingCalculation['kind']) =>
  createSelector(
    [selectFixtureState],
    (slice) => slice.calculations[kind] ?? null
  );

export const selectCalculationHistory = createSelector(
  [selectFixtureState],
  (slice) => slice.calculationsHistory
);

export const selectValidationReport = createSelector(
  [selectFixtureState],
  (slice) => slice.validationReport
);

export const selectValidating = createSelector(
  [selectFixtureState],
  (slice) => slice.validating
);

export const selectRuleSet = createSelector(
  [selectFixtureState],
  (slice) => slice.ruleSet
);

export const selectActivationContext = createSelector(
  [selectFixtureState],
  (slice) => slice.activationContext
);

export const selectPlacementProductId = createSelector(
  [selectFixtureState],
  (slice) => (slice as any).placementProductId ?? null
);

// ─── Room selection ──────────────────────────────────────────────────────────

export const selectSelectedRoomId = createSelector(
  [selectFixtureState],
  (slice) => (slice as any).selectedRoomId ?? null
);

export const selectIsRoomSelected = createSelector(
  [selectSelectedRoomId],
  (roomId) => roomId !== null
);

export const selectIsFixtureSelected = createSelector(
  [selectSelectedFixtureIds],
  (ids) => ids.length > 0
);

// ─── Heatmap selectors ────────────────────────────────────────────────────────

export const selectHeatmapVisible = createSelector(
  [selectFixtureState],
  (slice) => (slice as any).heatmapVisible === true
);

export const selectLatestPhotometricCalculation = createSelector(
  [selectFixtureState],
  (slice) => slice.calculations['illuminance-map'] ?? null
);

export const selectIsCalculating = createSelector(
  [selectFixtureState],
  (slice) => slice.runningCalculation === 'illuminance-map'
);

// ─── Layer visibility selectors ───────────────────────────────────────────────

export const selectLayerVisibility = createSelector(
  [selectFixtureState],
  (slice): LayerVisibility =>
    (slice as any).layerVisibility ?? DEFAULT_LAYER_VISIBILITY
);

export const selectLayerVisible = (layer: LayerKey) =>
  createSelector(
    [selectLayerVisibility],
    (vis): boolean => vis[layer] === true
  );

// ─── Session selectors ────────────────────────────────────────────────────────

export const selectFixtureDocument = createSelector(
  [selectDocumentId],
  (documentId) =>
    documentId ? SessionRegistry.get(documentId)?.fixtureDocument ?? null : null
);

export const selectFixtureHistory = createSelector(
  [selectDocumentId],
  (documentId) =>
    documentId ? SessionRegistry.get(documentId)?.history ?? null : null
);

// ─── Validation helpers ───────────────────────────────────────────────────────

export const selectValidationLayoutHash = createSelector(
  [selectLayout],
  (layout): string => {
    if (!layout) return '';
    const parts: string[] = [];
    for (const f of layout.fixtures) {
      parts.push(
        `${f.id}|${f.productId}|${f.x.toFixed(3)}|${f.y.toFixed(3)}|${f.rotation.toFixed(4)}`
      );
    }
    for (const z of layout.zones) {
      parts.push(`${z.id}|${z.memberFixtureIds.join(',')}`);
    }
    parts.sort();
    let hash = 5381;
    const str = parts.join(';');
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  }
);

// ─── Photometric service singleton ────────────────────────────────────────────

let photometricResolver: PhotometricDistributionResolver =
  createStubDistributionResolver();
let photometricServiceSingleton = new PhotometricService(photometricResolver);

export function setPhotometricResolver(
  resolver: PhotometricDistributionResolver
): void {
  photometricResolver = resolver;
  photometricServiceSingleton = new PhotometricService(photometricResolver);
}

export const selectPhotometricService = (_state: RootState): PhotometricService =>
  photometricServiceSingleton;

export function getPhotometricService(): PhotometricService {
  return photometricServiceSingleton;
}

/**
 * Access the current photometric resolver. Used by callers that need to
 * invoke resolver-level operations — specifically `clearCache()` after
 * a photometric file upload so subsequent calculations refetch.
 *
 * The resolver is a stable module-scope instance, swapped only via
 * setPhotometricResolver. Calling getPhotometricResolver() gives the
 * live object; mutating it (clearCache) takes effect immediately for
 * any code holding the same reference.
 */
export function getPhotometricResolver(): PhotometricDistributionResolver {
  return photometricResolver;
}

/**
 * Convenience wrapper — clears the resolver cache if the active
 * resolver supports it. Safe to call unconditionally; the stub resolver
 * (which has no cache) is a no-op.
 *
 * Call after uploading a photometric file so the next Calculate Lux
 * fetches the new distribution instead of the stale cached null.
 */
export function resetPhotometricResolverCache(): void {
  photometricResolver.clearCache?.();
}