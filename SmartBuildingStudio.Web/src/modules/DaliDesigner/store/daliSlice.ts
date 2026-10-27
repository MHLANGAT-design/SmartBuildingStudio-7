// src/modules/DaliDesigner/store/daliSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  DaliState,
  AssignmentSubMode,
  LayerVisibility,
  SidebarSectionKey,
  SidebarExpansion,
} from "@/modules/DaliDesigner/store/daliTypes";
import { createEmptyDaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";
import {
  loadDaliNetwork,
  saveDaliNetwork,
  saveDaliNetworkAs,
  addDaliLine,
  removeDaliLine,
  addDeviceFromLibrary,
  setDeviceAddress,
  assignDeviceToLine,
  syncDevicesWithFixtures,
  validateNetwork,
  loadFloorplan,
  loadRawGeometry,
  autoAddress,
  setSceneLevel,
  setSceneLevels,
} from "@/modules/DaliDesigner/store/daliThunks";
import { GroupManager } from "@/modules/DaliDesigner/Document/GroupManager";
import { SceneManager } from "@/modules/DaliDesigner/Document/SceneManager";

const initialLayerVisibility: LayerVisibility = {
  rooms: true,
  network: true,
  devices: true,
  groups: true,
  scenes: true,
  lineTopology: true,
  addressMap: true,
  signalFlow: true,
  validation: true,
  rawgeometry: false,
};

const initialSidebarExpansion: SidebarExpansion = {} as SidebarExpansion;

const initialState: DaliState = {
  document: createEmptyDaliDocument("", ""),
  selection: { deviceIds: [] },
  validation: [],
  status: "idle",
  dirty: false,
  lastSavedAt: null,
  error: null,
  layerVisibility: initialLayerVisibility,
  sidebarExpansion: initialSidebarExpansion,
  floorplan: { model: null, status: "idle", error: null },
  rawGeometry: { elements: [], status: "idle" },
  viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
};

const slice = createSlice({
  name: "dali",
  initialState,
  reducers: {
    setSelection(state, action: PayloadAction<Partial<DaliState["selection"]>>) {
      state.selection = { ...state.selection, ...action.payload };
    },
    setActiveScene(state, action: PayloadAction<string | undefined>) {
      state.selection.activeSceneId = action.payload;
      state.layerVisibility.signalFlow = !!action.payload;
    },
    toggleLayer(state, action: PayloadAction<keyof LayerVisibility>) {
      const key = action.payload;
      state.layerVisibility[key] = !state.layerVisibility[key];
    },
    setLayerVisibility(
      state,
      action: PayloadAction<{ layer: keyof LayerVisibility; visible: boolean }>
    ) {
      state.layerVisibility[action.payload.layer] = action.payload.visible;
    },
    showAllLayers(state) {
      for (const k of Object.keys(state.layerVisibility) as (keyof LayerVisibility)[]) {
        state.layerVisibility[k] = true;
      }
    },
    hideAllLayers(state) {
      for (const k of Object.keys(state.layerVisibility) as (keyof LayerVisibility)[]) {
        state.layerVisibility[k] = false;
      }
    },
    toggleSidebarSection(state, action: PayloadAction<SidebarSectionKey>) {
      const key = action.payload;
      state.sidebarExpansion[key] = !(state.sidebarExpansion[key] ?? true);
    },
    setViewportZoom(state, action: PayloadAction<number>) {
      state.viewport.zoom = action.payload;
    },
    setViewportOffset(state, action: PayloadAction<{ x: number; y: number }>) {
      state.viewport.offsetX = action.payload.x;
      state.viewport.offsetY = action.payload.y;
    },
    resetDaliDocument(state) {
      state.document = createEmptyDaliDocument("", "");
      state.selection = { deviceIds: [] };
      state.validation = [];
      state.status = "idle";
      state.dirty = false;
      state.lastSavedAt = null;
      state.error = null;
      state.floorplan.model = null;
      state.floorplan.status = "idle";
      state.floorplan.error = null;
      state.rawGeometry.elements = [];
      state.rawGeometry.status = "idle";
    },
    setCommissioningStatus(state, action: PayloadAction<DaliDocument["commissioning"]>) {
      state.document.commissioning = action.payload;
      state.dirty = true;
    },
    createGroup(state, action: PayloadAction<{ name: string; deviceIds: string[] }>) {
      const { doc } = GroupManager.create(state.document, action.payload.name);
      state.document = GroupManager.assignDevices(
        doc,
        doc.groups[doc.groups.length - 1].id,
        action.payload.deviceIds
      );
      state.dirty = true;
    },
    deleteGroup(state, action: PayloadAction<string>) {
      const groupId = action.payload;
      if (!groupId) return;
      state.document = GroupManager.remove(state.document, groupId);
      if (state.selection.groupId === groupId) {
        state.selection.groupId = undefined;
        state.selection.assignmentMode = false;
        state.selection.assignmentSubMode = undefined;
      }
      state.dirty = true;
    },
    renameGroup(state, action: PayloadAction<{ groupId: string; name: string }>) {
      const { groupId, name } = action.payload;
      if (!groupId) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      state.document = GroupManager.rename(state.document, groupId, trimmed);
      state.dirty = true;
    },
    createScene(state, action: PayloadAction<{ name: string }>) {
      const { doc } = SceneManager.create(state.document, action.payload.name);
      state.document = doc;
      state.dirty = true;
    },
    setAssignmentMode(state, action: PayloadAction<boolean>) {
      if (action.payload) {
        state.selection.assignmentMode = true;
        state.selection.assignmentSubMode = state.selection.assignmentSubMode ?? "add";
      } else {
        state.selection.assignmentMode = false;
        state.selection.assignmentSubMode = undefined;
      }
    },
    setAssignmentSubMode(state, action: PayloadAction<AssignmentSubMode>) {
      if (!state.selection.assignmentMode) return;
      state.selection.assignmentSubMode = action.payload;
    },
    assignDevicesToGroup(state, action: PayloadAction<{ groupId: string; deviceIds: string[] }>) {
      const { groupId, deviceIds } = action.payload;
      if (!groupId || deviceIds.length === 0) return;
      state.document = GroupManager.assignDevices(state.document, groupId, deviceIds);
      state.dirty = true;
    },
    removeDevicesFromGroup(state, action: PayloadAction<{ groupId: string; deviceIds: string[] }>) {
      const { groupId, deviceIds } = action.payload;
      if (!groupId || deviceIds.length === 0) return;
      state.document = GroupManager.removeDevices(state.document, groupId, deviceIds);
      state.dirty = true;
    },
    markClean(state) {
      state.dirty = false;
      state.lastSavedAt = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDaliNetwork.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadDaliNetwork.fulfilled, (state, action) => {
        state.document = action.payload;
        state.status = "idle";
        state.dirty = false;
        state.lastSavedAt = action.payload.updatedAt;
        state.selection.assignmentMode = false;
        state.selection.assignmentSubMode = undefined;
      })
      .addCase(loadDaliNetwork.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message ?? "Failed to load DALI network";
      })
      .addCase(saveDaliNetwork.pending, (state) => {
        state.status = "saving";
      })
      .addCase(saveDaliNetwork.fulfilled, (state, action) => {
        state.document = action.payload;
        state.status = "idle";
        state.dirty = false;
        state.lastSavedAt = action.payload.updatedAt;
      })
      .addCase(saveDaliNetwork.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message ?? "Failed to save";
      })
      .addCase(saveDaliNetworkAs.fulfilled, (state, action) => {
        state.document = action.payload;
        state.dirty = false;
      })
      .addCase(addDaliLine.fulfilled, (state, action) => {
        state.document = action.payload;
        state.dirty = true;
      })
      .addCase(removeDaliLine.fulfilled, (state, action) => {
        state.document = action.payload;
        state.dirty = true;
      })
      .addCase(addDeviceFromLibrary.fulfilled, (state, action) => {
        state.document = action.payload;
        state.dirty = true;
      })
      .addCase(setDeviceAddress.fulfilled, (state, action) => {
        state.document = action.payload;
        state.dirty = true;
      })
      .addCase(assignDeviceToLine.fulfilled, (state, action) => {
        state.document = action.payload;
        state.dirty = true;
      })
      .addCase(autoAddress.fulfilled, (state, action) => {
        state.document = action.payload;
        state.dirty = true;
      })
      .addCase(syncDevicesWithFixtures.fulfilled, (state, action) => {
        state.document = action.payload;
        state.dirty = true;
      })
      .addCase(setSceneLevel.fulfilled, (state, action) => {
        state.document = action.payload;
        state.dirty = true;
      })
      .addCase(setSceneLevels.fulfilled, (state, action) => {
        state.document = action.payload;
        state.dirty = true;
      })
      .addCase(validateNetwork.fulfilled, (state, action) => {
        state.validation = action.payload;
      })
      // ── Floorplan ────────────────────────────────────────────────
      .addCase(loadFloorplan.pending, (state) => {
        state.floorplan.status = "loading";
        state.floorplan.error = null;
      })
      .addCase(loadFloorplan.fulfilled, (state, action) => {
        state.floorplan.model = action.payload;
        state.floorplan.status = "ready";
        // Reset raw geometry — new document, no cached raw lines
        state.rawGeometry.elements = [];
        state.rawGeometry.status = "idle";
      })
      .addCase(loadFloorplan.rejected, (state, action) => {
        state.floorplan.status = "error";
        state.floorplan.error =
          (action.payload as string) ?? action.error.message ?? "Floorplan load failed";
      })
      // ── Raw geometry (lazy) ──────────────────────────────────────
      .addCase(loadRawGeometry.pending, (state) => {
        state.rawGeometry.status = "loading";
      })
      .addCase(loadRawGeometry.fulfilled, (state, action) => {
        state.rawGeometry.status = "ready";
        state.rawGeometry.elements = action.payload;
      })
      .addCase(loadRawGeometry.rejected, (state) => {
        state.rawGeometry.status = "error";
      });
  },
});

export const {
  setSelection,
  setActiveScene,
  toggleLayer,
  setLayerVisibility,
  showAllLayers,
  hideAllLayers,
  toggleSidebarSection,
  setViewportZoom,
  setViewportOffset,
  resetDaliDocument,
  setCommissioningStatus,
  createGroup,
  deleteGroup,
  renameGroup,
  createScene,
  setAssignmentMode,
  setAssignmentSubMode,
  assignDevicesToGroup,
  removeDevicesFromGroup,
  markClean,
} = slice.actions;

export type { LayerVisibility } from "@/modules/DaliDesigner/store/daliTypes";

export const daliReducer = slice.reducer;
export default slice.reducer;