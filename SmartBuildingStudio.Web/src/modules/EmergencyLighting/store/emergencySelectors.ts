// src/modules/EmergencyLighting/store/emergencySelectors.ts

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/Application/ConfigureStore';
import type { Fixture } from '@/modules/FixturePlacementStudio/models/Fixture';
import { isEmergencyLight } from '@/modules/FixturePlacementStudio/models/Fixture';
import type { Zone } from '@/modules/FixturePlacementStudio/models/Zone';
import type {
  ComplianceIssue,
  EmergencySidebarSectionKey,
} from '@/modules/EmergencyLighting/store/emergencyTypes';

// ─── Raw slices ────────────────────────────────────────────────────

export const selectEmergencyState = (state: RootState) => state.emergency;

export const selectFloorplanModel = (state: RootState) =>
  state.emergency.floorplan.model;

export const selectAllFixtures = (state: RootState): Fixture[] =>
  state.emergency.floorplan.model?.fixtures ?? [];

export const selectAllZones = (state: RootState): Zone[] =>
  state.emergency.floorplan.model?.zones ?? [];

export const selectAllRooms = (state: RootState): any[] =>
  state.emergency.floorplan.model?.rooms ?? [];

export const selectIssues = (state: RootState): ComplianceIssue[] =>
  state.emergency.simulation.issues ?? [];

export const selectSimStatus = (
  state: RootState
): 'idle' | 'running' | 'complete' | 'error' =>
  state.emergency.simulation.status ?? 'idle';

export const selectLayerVisibility = (state: RootState) =>
  state.emergency.layerVisibility;

export const selectActivePanel = (state: RootState) =>
  state.emergency.ui.activePanel;

export const selectSelectedRouteId = (state: RootState) =>
  state.emergency.ui.selectedRouteId;

export const selectSelectedEmergencyFixtureId = (state: RootState) =>
  state.emergency.ui.selectedEmergencyFixtureId;

export const selectSelectedZoneId = (state: RootState) =>
  state.emergency.ui.selectedZoneId;

export const selectSidebarExpansion = (state: RootState) =>
  state.emergency.sidebarExpansion;

export const selectSidebarSectionOpen = (
  state: RootState,
  key: EmergencySidebarSectionKey
): boolean => state.emergency.sidebarExpansion[key] ?? true;

export const selectFloorplanStatus = (state: RootState) =>
  state.emergency.floorplan.status;

export const selectIsLoading = (state: RootState) =>
  state.emergency.floorplan.status === 'loading';

// ─── Derived views ─────────────────────────────────────────────────

/** Fixtures placed with kind === 'emergencyLight'. */
export const selectEmergencyLightFixtures = createSelector(
  [selectAllFixtures],
  (fixtures) => fixtures.filter(isEmergencyLight)
);

/** Emergency lights whose classification marks them as exit signage. */
export const selectExitSignFixtures = createSelector(
  [selectAllFixtures],
  (fixtures) =>
    fixtures.filter(
      (f) =>
        isEmergencyLight(f) &&
        f.emergencyLight?.classification === 'exit-sign'
    )
);

/** roomId -> display name. */
export const selectRoomNameById = createSelector(
  [selectAllRooms],
  (rooms): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const r of rooms) {
      const id = String(r?.id ?? '');
      if (id) out[id] = String(r?.name ?? 'Unnamed Room');
    }
    return out;
  }
);

/** Issues grouped by ruleId, preserving the order they appear in state. */
export const selectIssuesByRule = createSelector(
  [selectIssues],
  (issues): Record<string, ComplianceIssue[]> => {
    const groups: Record<string, ComplianceIssue[]> = {};
    for (const issue of issues) {
      (groups[issue.ruleId] ??= []).push(issue);
    }
    return groups;
  }
);

/** Issue counts by severity. */
export const selectIssueCounts = createSelector([selectIssues], (issues) => {
  const counts = { error: 0, warning: 0, info: 0 };
  for (const issue of issues) counts[issue.severity]++;
  return counts;
});

/** Look up a selected emergency fixture by id. Returns null for missing or non-emergency. */
export const selectEmergencyFixtureById = createSelector(
  [selectAllFixtures, (_state: RootState, id: string | null) => id],
  (fixtures, id): Fixture | null => {
    if (!id) return null;
    const found = fixtures.find((f) => f.id === id);
    if (!found || !isEmergencyLight(found)) return null;
    return found;
  }
);

/** Look up a selected zone by id. */
export const selectZoneById = createSelector(
  [selectAllZones, (_state: RootState, id: string | null) => id],
  (zones, id): Zone | null => {
    if (!id) return null;
    return zones.find((z) => z.id === id) ?? null;
  }
);