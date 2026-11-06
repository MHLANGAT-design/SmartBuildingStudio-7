// src/modules/DeviceDiscovery/Store/deviceDiscoverySelectors.ts

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/Application/ConfigureStore';
import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';
import type { DiscoverySession } from '@/modules/DeviceDiscovery/Models/DiscoverySession';
import type { DeviceMatch } from '@/modules/DeviceDiscovery/Models/DeviceMatch';
import type { DeviceIdentification } from '@/modules/DeviceDiscovery/Models/DeviceIdentification';
import {
  buildDeviceCapabilities,
  type DeviceCapabilities,
} from '@/modules/DeviceDiscovery/Models/DeviceCapabilities';
import type {
  DeviceDiscoveryFloorplanRenderModel,
} from '@/modules/DeviceDiscovery/Document/DeviceDiscoveryFloorplanLoader';

/* ------------------------------------------------------------------ */
/* Slice root                                                          */
/* ------------------------------------------------------------------ */

export const selectDeviceDiscovery = (s: RootState) => s.deviceDiscovery;

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

export const selectSession = (s: RootState): DiscoverySession | null =>
  s.deviceDiscovery.session;

export const selectSessionId = (s: RootState): string | null =>
  s.deviceDiscovery.session?.sessionId ?? null;

export const selectIsDiscovering = (s: RootState): boolean => {
  const st = s.deviceDiscovery.session?.status;
  return st === 'RUNNING' || st === 'STARTING';
};

export const selectIsSessionLoading = (s: RootState): boolean => {
  const a = s.deviceDiscovery.async;
  return (
    a.createSession || a.startDiscovery || a.stopDiscovery ||
    a.cancelDiscovery || a.refreshSession
  );
};

export const selectSessionPhase = (s: RootState) =>
  s.deviceDiscovery.session?.phase ?? 'IDLE';

export const selectSessionProgress = (s: RootState) =>
  s.deviceDiscovery.session?.progress ?? null;

/* ------------------------------------------------------------------ */
/* Selection                                                           */
/* ------------------------------------------------------------------ */

export const selectSelectedGatewayId = (s: RootState) =>
  s.deviceDiscovery.selection.selectedGatewayId;
export const selectSelectedProjectId = (s: RootState) =>
  s.deviceDiscovery.selection.selectedProjectId;
export const selectSelectedBuildingId = (s: RootState) =>
  s.deviceDiscovery.selection.selectedBuildingId;
export const selectSelectedFloorId = (s: RootState) =>
  s.deviceDiscovery.selection.selectedFloorId;
export const selectSelectedDrawingId = (s: RootState) =>
  s.deviceDiscovery.selection.selectedDrawingId;
export const selectSelectedDaliLineId = (s: RootState) =>
  s.deviceDiscovery.selection.selectedDaliLineId;
export const selectSelectedDeviceId = (s: RootState): string | null =>
  s.deviceDiscovery.selection.selectedDeviceId;

/* ------------------------------------------------------------------ */
/* Devices                                                             */
/* ------------------------------------------------------------------ */

const selectAllDevices = createSelector(
  [
    (s: RootState) => s.deviceDiscovery.devicesById,
    (s: RootState) => s.deviceDiscovery.deviceIds,
  ],
  (byId, ids): DiscoveredDevice[] => ids.map(id => byId[id]).filter(Boolean),
);

// NEW: Filtered list for the selected line
export const selectDiscoveredDevices = createSelector(
  [selectAllDevices, selectSelectedDaliLineId],
  (devices, lineId): DiscoveredDevice[] => {
    if (!lineId) return devices;
    return devices.filter(d => d.daliLineId === lineId);
  }
);

// Keep the unfiltered list for other uses (like the canvas)
export const selectAllDiscoveredDevices = selectAllDevices;

export const selectDiscoveredDeviceById = (deviceId: string | null) =>
  (s: RootState): DiscoveredDevice | null =>
    deviceId ? s.deviceDiscovery.devicesById[deviceId] ?? null : null;

export const selectSelectedDevice = createSelector(
  [
    (s: RootState) => s.deviceDiscovery.selection.selectedDeviceId,
    (s: RootState) => s.deviceDiscovery.devicesById,
  ],
  (selectedId, byId): DiscoveredDevice | null =>
    selectedId ? byId[selectedId] ?? null : null,
);

export const selectDeviceCount = (s: RootState): number =>
  s.deviceDiscovery.deviceIds.length;

/* ------------------------------------------------------------------ */
/* Capabilities (derived)                                              */
/* ------------------------------------------------------------------ */

const selectCapabilitiesRaw = createSelector(
  [
    (s: RootState) => s.deviceDiscovery.devicesById,
    (s: RootState) => s.deviceDiscovery.deviceIds,
  ],
  (byId, ids): Record<string, DeviceCapabilities> => {
    const out: Record<string, DeviceCapabilities> = {};
    for (const id of ids) {
      const d = byId[id];
      if (d) out[id] = buildDeviceCapabilities(d.deviceId, d.capabilities);
    }
    return out;
  },
);

export const selectDeviceCapabilities = (deviceId: string | null) =>
  (s: RootState): DeviceCapabilities | null =>
    deviceId ? selectCapabilitiesRaw(s)[deviceId] ?? null : null;

/* ------------------------------------------------------------------ */
/* Identification                                                      */
/* ------------------------------------------------------------------ */

export const selectIdentificationByDeviceId = (deviceId: string | null) =>
  (s: RootState): DeviceIdentification | null =>
    deviceId
      ? s.deviceDiscovery.identificationsByDeviceId[deviceId] ?? null
      : null;

/* ------------------------------------------------------------------ */
/* Matches                                                             */
/* ------------------------------------------------------------------ */

export const selectMatches = createSelector(
  [
    (s: RootState) => s.deviceDiscovery.matchesById,
    (s: RootState) => s.deviceDiscovery.matchIds,
  ],
  (byId, ids): DeviceMatch[] => ids.map(id => byId[id]).filter(Boolean),
);

export const selectMatchForDevice = (deviceId: string | null) =>
  createSelector(
    [
      (s: RootState) => s.deviceDiscovery.matchesById,
      (s: RootState) => s.deviceDiscovery.matchIds,
    ],
    (byId, ids): DeviceMatch | null => {
      if (!deviceId) return null;
      for (const id of ids) {
        if (byId[id]?.deviceId === deviceId) return byId[id];
      }
      return null;
    },
  );

export const selectMatchesWithDiscrepancies = createSelector(
  [selectMatches],
  (matches): DeviceMatch[] => matches.filter(m => m.discrepancies.length > 0),
);

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

export const selectResult = (s: RootState) => s.deviceDiscovery.result;

/* ------------------------------------------------------------------ */
/* History                                                             */
/* ------------------------------------------------------------------ */

export const selectHistory = createSelector(
  [
    (s: RootState) => s.deviceDiscovery.historyById,
    (s: RootState) => s.deviceDiscovery.historyIds,
  ],
  (byId, ids): DiscoverySession[] => ids.map(id => byId[id]).filter(Boolean),
);

/* ------------------------------------------------------------------ */
/* Floorplan                                                           */
/* ------------------------------------------------------------------ */

export const selectFloorplan = (
  s: RootState,
): DeviceDiscoveryFloorplanRenderModel | null =>
  s.deviceDiscovery.floorplan;

export const selectFloorplanId = (s: RootState): string | null =>
  s.deviceDiscovery.floorplanId;

export const selectFloorplanLoading = (s: RootState): boolean =>
  s.deviceDiscovery.floorplanLoading;

export const selectFloorplanError = (s: RootState): string | null =>
  s.deviceDiscovery.floorplanError;

/** Map of design-fixture id → placement, derived from the loaded plan. */
export const selectDesignFixturePlacements = createSelector(
  [selectFloorplan],
  (plan): Record<string, { x: number; y: number }> => {
    if (!plan) return {};
    const out: Record<string, { x: number; y: number }> = {};
    for (const f of plan.fixtures ?? []) {
      out[f.id] = { x: f.x, y: f.y };
    }
    return out;
  },
);

/* ------------------------------------------------------------------ */
/* Viewport                                                            */
/* ------------------------------------------------------------------ */

export const selectViewport = (s: RootState) => s.deviceDiscovery.viewport;

/* ------------------------------------------------------------------ */
/* Async flags & errors (per-flow)                                     */
/* ------------------------------------------------------------------ */

export const selectAsyncFlags = (s: RootState) => s.deviceDiscovery.async;
export const selectErrors = (s: RootState) => s.deviceDiscovery.errors;

export const selectSessionError = (s: RootState) =>
  s.deviceDiscovery.errors.session;
export const selectDevicesError = (s: RootState) =>
  s.deviceDiscovery.errors.devices;
export const selectIdentificationError = (s: RootState) =>
  s.deviceDiscovery.errors.identification;
export const selectMatchingError = (s: RootState) =>
  s.deviceDiscovery.errors.matching;
export const selectResultsError = (s: RootState) =>
  s.deviceDiscovery.errors.results;
export const selectHistoryError = (s: RootState) =>
  s.deviceDiscovery.errors.history;

/** Aggregate "is anything loading?" used by page-level spinners. */
export const selectAnyLoading = (s: RootState): boolean =>
  Object.values(s.deviceDiscovery.async).some(Boolean);

/** Aggregate "first error found", for a single toast in the page header. */
export const selectFirstError = createSelector(
  [selectErrors],
  (errors): string | null =>
    errors.session ??
    errors.devices ??
    errors.identification ??
    errors.matching ??
    errors.results ??
    errors.history ??
    null,
);