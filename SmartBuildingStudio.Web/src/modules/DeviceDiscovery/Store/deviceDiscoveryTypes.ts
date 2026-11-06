// src/modules/DeviceDiscovery/Store/deviceDiscoveryTypes.ts

/**
 * Store-level types for the DeviceDiscovery slice.
 *
 * These are intentionally separate from Models/ — the slice holds Models plus
 * UI-only state (selected ids, request flags, errors) that never leaves the
 * frontend. Selectors expose Models; components never read this file directly.
 */

import type { DiscoverySession } from '@/modules/DeviceDiscovery/Models/DiscoverySession';
import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';
import type { DeviceIdentification } from '@/modules/DeviceDiscovery/Models/DeviceIdentification';
import type { DeviceMatch } from '@/modules/DeviceDiscovery/Models/DeviceMatch';
import type { DiscoveryResult } from '@/modules/DeviceDiscovery/Models/DiscoveryResult';
import type {
  DeviceDiscoveryFloorplanRenderModel,
} from '@/modules/DeviceDiscovery/Document/DeviceDiscoveryFloorplanLoader';

/* ------------------------------------------------------------------ */
/* Async flags                                                         */
/* ------------------------------------------------------------------ */

/** Per-request async flags. One entry per thunk so the UI can show granular spinners. */
export interface AsyncFlags {
  createSession: boolean;
  startDiscovery: boolean;
  stopDiscovery: boolean;
  cancelDiscovery: boolean;
  refreshSession: boolean;
  fetchDevices: boolean;
  identifyDevice: boolean;
  matchDevices: boolean;
  fetchMatches: boolean;
  fetchResults: boolean;
  fetchHistory: boolean;
  fetchHistoryEntry: boolean;
  /** Floorplan document load — driven by useDeviceDiscoveryFloorplan, not a thunk. */
  loadFloorplan: boolean;
}

export const INITIAL_ASYNC_FLAGS: AsyncFlags = {
  createSession: false,
  startDiscovery: false,
  stopDiscovery: false,
  cancelDiscovery: false,
  refreshSession: false,
  fetchDevices: false,
  identifyDevice: false,
  matchDevices: false,
  fetchMatches: false,
  fetchResults: false,
  fetchHistory: false,
  fetchHistoryEntry: false,
  loadFloorplan: false,
};

/* ------------------------------------------------------------------ */
/* Selection                                                           */
/* ------------------------------------------------------------------ */

/** Selection state — the ids the user has clicked on. */
export interface SelectionState {
  selectedGatewayId: string | null;
  selectedProjectId: string | null;
  selectedBuildingId: string | null;
  selectedFloorId: string | null;
  selectedDrawingId: string | null;
  selectedDaliLineId: string | null;
  selectedDeviceId: string | null;
}

export const INITIAL_SELECTION: SelectionState = {
  selectedGatewayId: null,
  selectedProjectId: null,
  selectedBuildingId: null,
  selectedFloorId: null,
  selectedDrawingId: null,
  selectedDaliLineId: null,
  selectedDeviceId: null,
};

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

/** Error bag — one slot per thunk so an error in one flow doesn't block another. */
export interface ErrorBag {
  session: string | null;
  devices: string | null;
  identification: string | null;
  matching: string | null;
  results: string | null;
  history: string | null;
}

export const INITIAL_ERRORS: ErrorBag = {
  session: null,
  devices: null,
  identification: null,
  matching: null,
  results: null,
  history: null,
};

/* ------------------------------------------------------------------ */
/* Viewport (pan / zoom)                                               */
/* ------------------------------------------------------------------ */

/**
 * Canvas viewport for the floor plan. Lives in the slice (not local state)
 * so pan/zoom survive panel toggles, and so the GlobalZoomControl can read
 * zoom through a ZoomableSurface without prop-drilling.
 */
export interface ViewportState {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

export const INITIAL_VIEWPORT: ViewportState = {
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
};

/* ------------------------------------------------------------------ */
/* Slice state                                                         */
/* ------------------------------------------------------------------ */

/**
 * The full slice state.
 *
 * Collections are stored as normalized maps keyed by id + an id array for order,
 * so the UI can re-render a single row without diffing the whole list.
 */
export interface DeviceDiscoveryState {
  /** Current (live) discovery session, if one has been created. */
  session: DiscoverySession | null;

  /** Discovered devices for the current session, normalized. */
  devicesById: Record<string, DiscoveredDevice>;
  deviceIds: string[];

  /** Identification results keyed by deviceId. */
  identificationsByDeviceId: Record<string, DeviceIdentification>;

  /** Matches keyed by matchId. */
  matchesById: Record<string, DeviceMatch>;
  matchIds: string[];

  /** Aggregate result of the current session. */
  result: DiscoveryResult | null;

  /** Past sessions (DiscoveryHistory/). */
  historyById: Record<string, DiscoverySession>;
  historyIds: string[];

  /** Floor plan loaded for the active document. */
  floorplan: DeviceDiscoveryFloorplanRenderModel | null;
  /** Document id the loaded plan corresponds to (null = none). */
  floorplanId: string | null;
  floorplanLoading: boolean;
  floorplanError: string | null;

  /** Canvas pan/zoom for the floor plan. */
  viewport: ViewportState;

  selection: SelectionState;
  async: AsyncFlags;
  errors: ErrorBag;

  /** Monotonic counter incremented on every successful state-changing fetch —
   *  lets hooks know when to re-run effects without deep-comparing objects. */
  revision: number;
}