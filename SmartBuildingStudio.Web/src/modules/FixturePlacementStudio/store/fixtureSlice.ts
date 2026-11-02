// src/modules/FixturePlacementStudio/store/fixtureSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  FixtureSliceState,
  BeginLoadPayload,
  LoadSucceededPayload,
  LoadFailedPayload,
  SetLayoutPayload,
  PlaceFixturePayload,
  MoveFixturesPayload,
  RotateFixturesPayload,
  DeleteFixturesPayload,
  MergeFixturesPayload,
  CreateZonePayload,
  AddFixturesToZonePayload,
  RemoveFixturesFromZonePayload,
  DeleteZonesPayload,
  SetSelectionPayload,
  BeginCalculationPayload,
  CalculationSucceededPayload,
  CalculationFailedPayload,
  SaveSucceededPayload,
  SaveConflictPayload,
  SaveFailedPayload,
  ValidationSucceededPayload,
  ValidationFailedPayload,
  SetRuleSetPayload,
} from '@/modules/FixturePlacementStudio/store/fixtureTypes';
import {
  placeFixture as applyPlaceFixture,
  moveFixtures as applyMoveFixtures,
  rotateFixtures as applyRotateFixtures,
  deleteFixtures as applyDeleteFixtures,
  setFixturePositionAndRoom as applySetFixturePositionAndRoom,
  createZoneInLayout as applyCreateZone,
  addFixturesToZone as applyAddFixturesToZone,
  removeFixturesFromZone as applyRemoveFixturesFromZone,
  deleteZones as applyDeleteZones,
} from '@/modules/FixturePlacementStudio/services/FixturePlacementService';

// ─── Viewport sub-state ───────────────────────────────────────────────────────

export interface ViewportState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

const initialViewport: ViewportState = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};

// ─── Layer visibility ─────────────────────────────────────────────────────────

export type LayerKey =
  | 'grid'
  | 'rooms'
  | 'heatmap'
  | 'zones'
  | 'fixtures'
  | 'selection'
  | 'placement'
  | 'measurements'
  | 'snap';

export type LayerVisibility = Record<LayerKey, boolean>;

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  grid: true,
  rooms: true,
  heatmap: true,
  zones: true,
  fixtures: true,
  selection: true,
  placement: true,
  measurements: false,
  snap: false,
};

// ─── Extended slice state ─────────────────────────────────────────────────────

type ExtendedFixtureSliceState = FixtureSliceState & {
  viewport: ViewportState;
  placementProductId: string | null;
  heatmapVisible: boolean;
  selectedRoomId: string | null;
  layerVisibility: LayerVisibility;
};

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: ExtendedFixtureSliceState = {
  documentId: null,
  activationContext: null,
  loadStatus: 'idle',
  loadError: null,
  saveStatus: 'idle',
  saveError: null,
  conflict: null,
  layout: null,
  selectedFixtureIds: [],
  selectedZoneIds: [],
  calculations: {
    'lux-average': null,
    'uniformity': null,
    'illuminance-map': null,
    'emergency-compliance': null,
    'spacing-check': null,
  },
  calculationsHistory: [],
  runningCalculation: null,
  validationReport: null,
  validating: false,
  ruleSet: null,
  dirty: false,
  viewport: initialViewport,
  placementProductId: null,
  heatmapVisible: false,
  selectedRoomId: null,
  layerVisibility: { ...DEFAULT_LAYER_VISIBILITY },
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const fixtureSlice = createSlice({
  name: 'fixture',
  initialState,
  reducers: {
    // ── Load ──────────────────────────────────────────────────────────
    beginLoad(state, action: PayloadAction<BeginLoadPayload>) {
      state.activationContext = action.payload.activationContext;
      state.loadStatus = 'loading';
      state.loadError = null;
    },

    loadSucceeded(state, action: PayloadAction<LoadSucceededPayload>) {
      state.documentId = action.payload.documentId;
      state.layout = action.payload.layout;
      state.loadStatus = 'ready';
      state.loadError = null;
      state.saveStatus = 'idle';
      state.saveError = null;
      state.conflict = null;
      state.dirty = false;
      state.selectedFixtureIds = [];
      state.selectedZoneIds = [];
      state.selectedRoomId = null;
      state.calculations = initialState.calculations;
      state.calculationsHistory = [];
      state.validationReport = null;
      state.viewport = initialViewport;
      state.placementProductId = null;
      state.heatmapVisible = false;
      // Preserve layerVisibility across loads — it's a UI preference.
    },

    loadFailed(state, action: PayloadAction<LoadFailedPayload>) {
      state.loadStatus = 'error';
      state.loadError = action.payload.error;
    },

    setLayout(state, action: PayloadAction<SetLayoutPayload>) {
      state.layout = action.payload.layout;
      state.dirty = action.payload.layout.dirty ?? false;
    },

    // ── Placement mutations ───────────────────────────────────────────
    placeFixture(state, action: PayloadAction<PlaceFixturePayload>) {
      if (!state.layout) return;
      const { layout, fixture } = applyPlaceFixture(state.layout, action.payload);
      state.layout = layout;
      state.selectedFixtureIds = [fixture.id];
      state.selectedRoomId = null;
      state.dirty = true;
      state.heatmapVisible = false;
    },

    moveFixtures(state, action: PayloadAction<MoveFixturesPayload>) {
      if (!state.layout) return;
      state.layout = applyMoveFixtures(
        state.layout,
        action.payload.fixtureIds,
        action.payload.deltaX,
        action.payload.deltaY
      );
      state.dirty = true;
      state.heatmapVisible = false;
    },

    setFixturePositionAndRoom(
      state,
      action: PayloadAction<{
        fixtureId: string;
        x: number;
        y: number;
        roomId: string | undefined;
      }>
    ) {
      if (!state.layout) return;
      state.layout = applySetFixturePositionAndRoom(
        state.layout,
        action.payload.fixtureId,
        action.payload.x,
        action.payload.y,
        action.payload.roomId
      );
      state.dirty = true;
      state.heatmapVisible = false;
    },

    /**
     * Batch reposition. Used by align / distribute / snap-to-grid
     * toolbar operations. Unlike setFixturePositionAndRoom, this does
     * NOT touch each fixture's roomId — the room assignment is
     * preserved. Room re-assignment after an align/distribute/snap
     * happens on the next user drag or on save.
     *
     * One dispatch for N fixtures → one undo snapshot, one re-render.
     */
    repositionFixtures(
      state,
      action: PayloadAction<{
        positions: Array<{ id: string; x: number; y: number }>;
      }>
    ) {
      if (!state.layout) return;
      if (action.payload.positions.length === 0) return;

      const posMap = new Map(
        action.payload.positions.map((p) => [p.id, p])
      );

      state.layout = {
        ...state.layout,
        fixtures: state.layout.fixtures.map((f) => {
          const update = posMap.get(f.id);
          if (!update) return f;
          return { ...f, x: update.x, y: update.y };
        }),
        dirty: true,
      };
      state.dirty = true;
      state.heatmapVisible = false;
    },

    rotateFixtures(state, action: PayloadAction<RotateFixturesPayload>) {
      if (!state.layout) return;
      state.layout = applyRotateFixtures(
        state.layout,
        action.payload.fixtureIds,
        action.payload.radians
      );
      state.dirty = true;
      state.heatmapVisible = false;
    },

    deleteFixtures(state, action: PayloadAction<DeleteFixturesPayload>) {
      if (!state.layout) return;
      state.layout = applyDeleteFixtures(state.layout, action.payload.fixtureIds);
      const removed = new Set(action.payload.fixtureIds);
      state.selectedFixtureIds = state.selectedFixtureIds.filter(
        (id) => !removed.has(id)
      );
      state.dirty = true;
      state.heatmapVisible = false;
    },

    /**
     * Merge a batch of imported fixtures and zones into the current
     * layout. Ids are expected to be unique — the import thunk
     * regenerates them before dispatch so collisions are impossible.
     *
     * This is a mutation-type action: the history middleware pushes a
     * snapshot before the reducer runs, so an import can be undone.
     */
    mergeFixtures(state, action: PayloadAction<MergeFixturesPayload>) {
      if (!state.layout) return;
      const { fixtures, zones } = action.payload;
      state.layout = {
        ...state.layout,
        fixtures: [...state.layout.fixtures, ...fixtures],
        zones: [...state.layout.zones, ...zones],
        dirty: true,
      };
      state.heatmapVisible = false;
      state.selectedZoneIds = [];
    },

    // ── Zones ─────────────────────────────────────────────────────────
    createZone(state, action: PayloadAction<CreateZonePayload>) {
      if (!state.layout) return;
      const { layout } = applyCreateZone(state.layout, action.payload);
      state.layout = layout;
      state.dirty = true;
    },

    addFixturesToZone(state, action: PayloadAction<AddFixturesToZonePayload>) {
      if (!state.layout) return;
      state.layout = applyAddFixturesToZone(
        state.layout,
        action.payload.zoneId,
        action.payload.fixtureIds
      );
      state.dirty = true;
    },

    removeFixturesFromZone(state, action: PayloadAction<RemoveFixturesFromZonePayload>) {
      if (!state.layout) return;
      state.layout = applyRemoveFixturesFromZone(
        state.layout,
        action.payload.zoneId,
        action.payload.fixtureIds
      );
      state.dirty = true;
    },

    deleteZones(state, action: PayloadAction<DeleteZonesPayload>) {
      if (!state.layout) return;
      state.layout = applyDeleteZones(state.layout, action.payload.zoneIds);
      const removed = new Set(action.payload.zoneIds);
      state.selectedZoneIds = state.selectedZoneIds.filter(
        (id) => !removed.has(id)
      );
      state.dirty = true;
    },

    // ── Selection ─────────────────────────────────────────────────────
    setSelection(state, action: PayloadAction<SetSelectionPayload>) {
      if (action.payload.fixtureIds !== undefined) {
        state.selectedFixtureIds = action.payload.fixtureIds;
        if (action.payload.fixtureIds.length > 0) {
          state.selectedRoomId = null;
        }
      }
      if (action.payload.zoneIds !== undefined) {
        state.selectedZoneIds = action.payload.zoneIds;
      }
    },

    clearSelection(state) {
      state.selectedFixtureIds = [];
      state.selectedZoneIds = [];
      state.selectedRoomId = null;
    },

    setSelectedRoomId(state, action: PayloadAction<string | null>) {
      state.selectedRoomId = action.payload;
      if (action.payload) {
        state.selectedFixtureIds = [];
        state.selectedZoneIds = [];
      }
    },

    // ── Placement mode ────────────────────────────────────────────────
    setPlacementProduct(state, action: PayloadAction<string | null>) {
      state.placementProductId = action.payload;
    },

    // ── Heatmap ───────────────────────────────────────────────────────
    setHeatmapVisible(state, action: PayloadAction<boolean>) {
      state.heatmapVisible = action.payload;
    },

    // ── Layer visibility ──────────────────────────────────────────────
    setLayerVisible(
      state,
      action: PayloadAction<{ layer: LayerKey; visible: boolean }>
    ) {
      state.layerVisibility[action.payload.layer] = action.payload.visible;
    },

    toggleLayer(state, action: PayloadAction<LayerKey>) {
      state.layerVisibility[action.payload] =
        !state.layerVisibility[action.payload];
    },

    resetLayers(state) {
      state.layerVisibility = { ...DEFAULT_LAYER_VISIBILITY };
    },

    // ── Calculations ──────────────────────────────────────────────────
    beginCalculation(state, action: PayloadAction<BeginCalculationPayload>) {
      state.runningCalculation = action.payload.kind;
    },

    calculationSucceeded(state, action: PayloadAction<CalculationSucceededPayload>) {
      const calc = action.payload.calculation;
      state.calculations[calc.kind] = calc;
      state.calculationsHistory = [calc, ...state.calculationsHistory].slice(0, 20);
      state.runningCalculation = null;
      if (calc.kind === 'illuminance-map') {
        state.heatmapVisible = true;
      }
    },

    calculationFailed(state, action: PayloadAction<CalculationFailedPayload>) {
      state.runningCalculation = null;
      // eslint-disable-next-line no-console
      console.warn(
        `[fixtureSlice] Calculation ${action.payload.kind} failed:`,
        action.payload.error
      );
    },

    // ── Save ──────────────────────────────────────────────────────────
    beginSave(state) {
      state.saveStatus = 'saving';
      state.saveError = null;
      state.conflict = null;
    },

    saveSucceeded(state, action: PayloadAction<SaveSucceededPayload>) {
      state.saveStatus = 'saved';
      state.saveError = null;
      state.conflict = null;
      state.dirty = false;
      if (state.layout) {
        state.layout = {
          ...state.layout,
          revision: action.payload.revision,
          dirty: false,
        };
      }
    },

    saveConflict(state, action: PayloadAction<SaveConflictPayload>) {
      state.saveStatus = 'conflict';
      state.saveError = null;
      state.conflict = {
        serverRevision: action.payload.serverRevision,
        clientRevision: action.payload.clientRevision,
      };
    },

    saveFailed(state, action: PayloadAction<SaveFailedPayload>) {
      state.saveStatus = 'error';
      state.saveError = action.payload.error;
      state.conflict = null;
    },

    clearSaveStatus(state) {
      state.saveStatus = 'idle';
      state.saveError = null;
      state.conflict = null;
    },

    // ── Validation ────────────────────────────────────────────────────
    beginValidation(state) {
      state.validating = true;
    },

    validationSucceeded(state, action: PayloadAction<ValidationSucceededPayload>) {
      state.validationReport = action.payload.report;
      state.validating = false;
    },

    validationFailed(state: any, action: PayloadAction<ValidationFailedPayload>) {
      state.validating = false;
      // eslint-disable-next-line no-console
      console.warn('[fixtureSlice] Validation failed:', action.payload.error);
    },

    // ── Rule set ──────────────────────────────────────────────────────
    setRuleSet(state, action: PayloadAction<SetRuleSetPayload>) {
      state.ruleSet = action.payload.ruleSet;
    },

    // ── Viewport ──────────────────────────────────────────────────────
    setViewport(state, action: PayloadAction<Partial<ViewportState>>) {
      state.viewport = { ...state.viewport, ...action.payload };
    },
    setZoom(state, action: PayloadAction<number>) {
      state.viewport.zoom = action.payload;
    },
    setOffset(state, action: PayloadAction<{ x: number; y: number }>) {
      state.viewport.offsetX = action.payload.x;
      state.viewport.offsetY = action.payload.y;
    },

    // ── Reset ─────────────────────────────────────────────────────────
    reset() {
      return initialState;
    },
  },
});

// ─── Exports ──────────────────────────────────────────────────────────────────

export const {
  beginLoad,
  loadSucceeded,
  loadFailed,
  setLayout,
  placeFixture,
  moveFixtures,
  setFixturePositionAndRoom,
  repositionFixtures,
  rotateFixtures,
  deleteFixtures,
  mergeFixtures,
  createZone,
  addFixturesToZone,
  removeFixturesFromZone,
  deleteZones,
  setSelection,
  clearSelection,
  setSelectedRoomId,
  setPlacementProduct,
  setHeatmapVisible,
  setLayerVisible,
  toggleLayer,
  resetLayers,
  beginCalculation,
  calculationSucceeded,
  calculationFailed,
  beginSave,
  saveSucceeded,
  saveConflict,
  saveFailed,
  clearSaveStatus,
  beginValidation,
  validationSucceeded,
  validationFailed,
  setRuleSet,
  setViewport,
  setZoom,
  setOffset,
  reset,
} = fixtureSlice.actions;

export default fixtureSlice.reducer;