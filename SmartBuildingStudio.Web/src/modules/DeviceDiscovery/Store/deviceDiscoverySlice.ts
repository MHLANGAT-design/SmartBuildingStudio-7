// src/modules/DeviceDiscovery/Store/deviceDiscoverySlice.ts

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DiscoverySession } from '@/modules/DeviceDiscovery/Models/DiscoverySession';
import type { DiscoveredDevice } from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';
import type { DeviceIdentification } from '@/modules/DeviceDiscovery/Models/DeviceIdentification';
import type { DeviceMatch } from '@/modules/DeviceDiscovery/Models/DeviceMatch';
import type { DiscoveryResult } from '@/modules/DeviceDiscovery/Models/DiscoveryResult';
import type {
  DeviceDiscoveryFloorplanRenderModel,
} from '@/modules/DeviceDiscovery/Document/DeviceDiscoveryFloorplanLoader';
import type {
  AsyncFlags,
  DeviceDiscoveryState,
  ErrorBag,
  SelectionState,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoveryTypes';
import {
  INITIAL_ASYNC_FLAGS,
  INITIAL_ERRORS,
  INITIAL_SELECTION,
  INITIAL_VIEWPORT,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoveryTypes';

const initialState: DeviceDiscoveryState = {
  session: null,
  devicesById: {},
  deviceIds: [],
  identificationsByDeviceId: {},
  matchesById: {},
  matchIds: [],
  result: null,
  historyById: {},
  historyIds: [],
  selection: INITIAL_SELECTION,
  async: INITIAL_ASYNC_FLAGS,
  errors: INITIAL_ERRORS,
  revision: 0,

  // Floorplan
  floorplan: null,
  floorplanId: null,
  floorplanLoading: false,
  floorplanError: null,

  // Canvas viewport
  viewport: INITIAL_VIEWPORT,
};

const slice = createSlice({
  name: 'deviceDiscovery',
  initialState,
  reducers: {
    /* ---- Selection ---- */
    selectGateway(state, action: PayloadAction<string | null>) {
      state.selection.selectedGatewayId = action.payload;
    },
    selectProject(state, action: PayloadAction<string | null>) {
      state.selection.selectedProjectId = action.payload;
    },
    selectBuilding(state, action: PayloadAction<string | null>) {
      state.selection.selectedBuildingId = action.payload;
    },
    selectFloor(state, action: PayloadAction<string | null>) {
      state.selection.selectedFloorId = action.payload;
    },
    selectDrawing(state, action: PayloadAction<string | null>) {
      state.selection.selectedDrawingId = action.payload;
    },
    selectDaliLine(state, action: PayloadAction<string | null>) {
      state.selection.selectedDaliLineId = action.payload;
    },
    selectDevice(state, action: PayloadAction<string | null>) {
      state.selection.selectedDeviceId = action.payload;
    },

    /* ---- Session lifecycle (sync parts) ---- */
    setSession(state, action: PayloadAction<DiscoverySession | null>) {
      state.session = action.payload;
      if (action.payload) {
        state.deviceIds = state.deviceIds.filter(
          id => state.devicesById[id]?.sessionId === action.payload!.sessionId,
        );
      } else {
        state.devicesById = {};
        state.deviceIds = [];
        state.identificationsByDeviceId = {};
        state.matchesById = {};
        state.matchIds = [];
        state.result = null;
        state.selection.selectedDeviceId = null;
      }
      state.revision += 1;
    },
    clearSession(state) {
      state.session = null;
      state.devicesById = {};
      state.deviceIds = [];
      state.identificationsByDeviceId = {};
      state.matchesById = {};
      state.matchIds = [];
      state.result = null;
      state.selection.selectedDeviceId = null;

      // A session switch is a document switch — the plan and viewport
      // must not survive it.
      state.floorplan = null;
      state.floorplanId = null;
      state.floorplanLoading = false;
      state.floorplanError = null;
      state.viewport = INITIAL_VIEWPORT;
      state.async.loadFloorplan = false;

      state.revision += 1;
    },

    /* ---- Devices ---- */
    setDevices(state, action: PayloadAction<DiscoveredDevice[]>) {
      const list = action.payload;
      state.devicesById = {};
      state.deviceIds = [];
      for (const d of list) {
        state.devicesById[d.deviceId] = d;
        state.deviceIds.push(d.deviceId);
      }
      state.revision += 1;
    },
    upsertDevice(state, action: PayloadAction<DiscoveredDevice>) {
      const d = action.payload;
      if (!state.devicesById[d.deviceId]) {
        state.deviceIds.push(d.deviceId);
      }
      state.devicesById[d.deviceId] = d;
      state.revision += 1;
    },

    /* ---- Identification ---- */
    setIdentification(state, action: PayloadAction<DeviceIdentification>) {
      state.identificationsByDeviceId[action.payload.deviceId] = action.payload;
      state.revision += 1;
    },

    /* ---- Matches ---- */
    setMatches(state, action: PayloadAction<DeviceMatch[]>) {
      const list = action.payload;
      state.matchesById = {};
      state.matchIds = [];
      for (const m of list) {
        state.matchesById[m.matchId] = m;
        state.matchIds.push(m.matchId);
      }
      state.revision += 1;
    },

    /* ---- Result ---- */
    setResult(state, action: PayloadAction<DiscoveryResult | null>) {
      state.result = action.payload;
      state.revision += 1;
    },

    /* ---- History ---- */
    setHistory(state, action: PayloadAction<DiscoverySession[]>) {
      const list = action.payload;
      state.historyById = {};
      state.historyIds = [];
      for (const s of list) {
        state.historyById[s.sessionId] = s;
        state.historyIds.push(s.sessionId);
      }
      state.revision += 1;
    },
    upsertHistoryEntry(state, action: PayloadAction<DiscoverySession>) {
      const s = action.payload;
      if (!state.historyById[s.sessionId]) {
        state.historyIds.push(s.sessionId);
      }
      state.historyById[s.sessionId] = s;
      state.revision += 1;
    },

    /* ---- Floorplan ---- */
    setFloorplanLoading(state, action: PayloadAction<boolean>) {
      state.floorplanLoading = action.payload;
      state.async.loadFloorplan = action.payload;
    },
    setFloorplan(
      state,
      action: PayloadAction<{
        id: string;
        model: DeviceDiscoveryFloorplanRenderModel;
      }>,
    ) {
      state.floorplanId = action.payload.id;
      state.floorplan = action.payload.model;
      state.floorplanLoading = false;
      state.floorplanError = null;
      state.async.loadFloorplan = false;
      state.revision += 1;
    },
    setFloorplanError(state, action: PayloadAction<string>) {
      state.floorplanError = action.payload;
      state.floorplanLoading = false;
      state.async.loadFloorplan = false;
    },
    clearFloorplan(state) {
      state.floorplan = null;
      state.floorplanId = null;
      state.floorplanLoading = false;
      state.floorplanError = null;
      state.async.loadFloorplan = false;
    },

    /* ---- Canvas viewport (pan / zoom) ---- */
    setViewport(
      state,
      action: PayloadAction<{ offsetX?: number; offsetY?: number; zoom?: number }>,
    ) {
      const p = action.payload;
      if (p.offsetX !== undefined) state.viewport.offsetX = p.offsetX;
      if (p.offsetY !== undefined) state.viewport.offsetY = p.offsetY;
      if (p.zoom !== undefined) state.viewport.zoom = p.zoom;
    },
    resetViewport(state) {
      state.viewport = INITIAL_VIEWPORT;
    },

    /* ---- Async flags ---- */
    setAsyncFlag(
      state,
      action: PayloadAction<{ flag: keyof AsyncFlags; value: boolean }>,
    ) {
      state.async[action.payload.flag] = action.payload.value;
    },

    /* ---- Errors ---- */
    setError(
      state,
      action: PayloadAction<{ slot: keyof ErrorBag; message: string | null }>,
    ) {
      state.errors[action.payload.slot] = action.payload.message;
    },
    clearErrors(state) {
      state.errors = INITIAL_ERRORS;
    },
    clearSelection(state) {
      state.selection = INITIAL_SELECTION;
    },
  },
});

export const {
  selectGateway,
  selectProject,
  selectBuilding,
  selectFloor,
  selectDrawing,
  selectDaliLine,
  selectDevice,
  setSession,
  clearSession,
  setDevices,
  upsertDevice,
  setIdentification,
  setMatches,
  setResult,
  setHistory,
  upsertHistoryEntry,
  setFloorplanLoading,
  setFloorplan,
  setFloorplanError,
  clearFloorplan,
  setViewport,
  resetViewport,
  setAsyncFlag,
  setError,
  clearErrors,
  clearSelection,
} = slice.actions;

export const deviceDiscoveryReducer = slice.reducer;
export default deviceDiscoveryReducer;