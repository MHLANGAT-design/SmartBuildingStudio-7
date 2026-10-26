// src/modules/FloorPlanDesigner/Store/FloorPlanThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { ThunkApiConfig } from "@/Application/ConfigureStore";
import * as FloorPlanSlice from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { API_ROUTES } from "@/Application/ApiRoutes";
import { BackendPayloadMapper } from "@/modules/FloorPlanDesigner/Store/BackendPayloadMapper";

// ─── FETCH ────────────────────────────────────────────────────────────────────
export const openDrawing = createAsyncThunk<
  void,
  string,
  ThunkApiConfig
>(
  "floorPlan/openDrawing",
  async (documentId, { dispatch }) => {
    dispatch(FloorPlanSlice.setLoading(true));
    dispatch(FloorPlanSlice.clearError());
    try {
      console.log(`[Thunks] Opening drawing with ID: ${documentId}`);
      const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.GET(documentId);
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch document: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      console.log("[Thunks] ✅ Raw response payload:", data);

      // The mapper is the single source of truth for the document shape.
      // It produces walls, doors, windows, rooms, electricalFixtures, and
      // projects fixtures AND rooms into `elements` so the canvas render
      // loop finds them.
      const documentData = BackendPayloadMapper.fromLegacyBackend(data);

      console.log("[Thunks] 🧪 Mapper produced:", {
        walls: documentData.walls?.length,
        doors: documentData.doors?.length,
        windows: documentData.windows?.length,
        rooms: documentData.rooms?.length,
        electricalFixtures: documentData.electricalFixtures?.length,
        lightingZones: (documentData as any).lightingZones?.length,
        elements: (documentData as any).elements?.length,
      });

      // Set the id from the server, in one place, before dispatch.
      documentData.id = data.id || data.documentId || documentData.id;

      // ── No global writes here ───────────────────────────────────────
      // The thunk previously wrote:
      //   window.__persistentDwgVectorBackupCache = [...documentData.walls];
      //   window.__floorPlanActiveDocumentInstance = documentData;
      //
      // Both are second sources of truth that the canvas and other hooks
      // also read. The document instance is owned exclusively by
      // UseFloorPlanDesignerDocument, which builds a real DrawingDocument
      // from the Redux state and installs it on window. Writing a plain
      // object here (not a DrawingDocument instance) caused the canvas to
      // read a shape it didn't expect, and the persistent cache leaked the
      // previous document's walls into the new one.
      //
      // Redux is the single source of truth for document data. The instance
      // and cache are derived, not written from here.

      dispatch(FloorPlanSlice.setDocument(documentData));
      dispatch(FloorPlanSlice.markClean());
      window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
      console.log("[Thunks] Drawing opened and synchronized successfully.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to open drawing";
      console.error("[Thunks] Failed to open drawing:", errorMessage);
      dispatch(FloorPlanSlice.setError(errorMessage));
      throw error;
    } finally {
      dispatch(FloorPlanSlice.setLoading(false));
    }
  }
);

// ─── SAVE ─────────────────────────────────────────────────────────────────────
export const saveDrawing = createAsyncThunk<
  void,
  string,
  ThunkApiConfig
>(
  "floorPlan/saveDrawing",
  async (docIdFromArgs, { dispatch, getState }) => {
    dispatch(FloorPlanSlice.setSaving(true));
    dispatch(FloorPlanSlice.clearError());
    try {
      const state = getState();
      const floorPlan = state.floorPlan || {};
      const document = floorPlan.document;

      if (!document) {
        throw new Error("No document in Redux state");
      }

      const docId = docIdFromArgs || document.id;
      if (!docId) {
        throw new Error("No document ID available to save. Please open a document first.");
      }

      console.log("[Thunks saveDrawing] Saving document ID:", docId);

      const payload = BackendPayloadMapper.toLegacyBackend(document);
      payload.id = docId;
      payload.Name = document.name || "Untitled";
      payload.activeProjectName = document.activeProjectName || "Unknown Project";
      payload.activeBuildingName = document.activeBuildingName || "Unknown Building";
      payload.activeFloorName = document.activeFloorName || "Unknown Floor";
      payload.activeDocumentName = document.activeDocumentName || document.name || "Untitled";

      console.log("[Thunks saveDrawing] 📤 Payload:", {
        id: payload.id,
        DrawnWallsJsonLength: payload.DrawnWallsJson?.length || 0,
        DefinedRoomsJsonLength: payload.DefinedRoomsJson?.length || 0,
        PlacedFixturesJsonLength: payload.PlacedFixturesJson?.length || 0,
      });

      const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.UPDATE(docId);
      console.log("[Thunks saveDrawing] 🔗 Sending PUT to:", url);

      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log("[Thunks saveDrawing] 📨 Response status:", response.status, "Body:", responseText);

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status} - ${responseText}`);
      }

      dispatch(FloorPlanSlice.markClean());
      dispatch(FloorPlanSlice.markSaved());

      // No global writes here either — the instance is rebuilt from the
      // updated Redux state by UseFloorPlanDesignerDocument.

      window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
      window.dispatchEvent(new CustomEvent("sbs:document-saved"));
      console.log("[Thunks saveDrawing] ✅ Save completed successfully.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Save failed";
      console.error("[Thunks saveDrawing] ❌ Failed:", errorMessage);
      dispatch(FloorPlanSlice.setError(errorMessage));
      throw error;
    } finally {
      dispatch(FloorPlanSlice.setSaving(false));
    }
  }
);

// ─── LOAD (alternate) ────────────────────────────────────────────────────────
export const loadFloorPlan = createAsyncThunk<
  any,
  string,
  ThunkApiConfig
>(
  "floorPlan/loadFloorPlan",
  async (documentId, { dispatch }) => {
    dispatch(FloorPlanSlice.setLoading(true));
    dispatch(FloorPlanSlice.clearError());
    try {
      console.log(`[Thunks] Loading floor plan: ${documentId}`);
      const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.GET(documentId);
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load floor plan: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      const documentData = BackendPayloadMapper.fromLegacyBackend(data);
      documentData.id = data.id || data.documentId || documentData.id;

      dispatch(FloorPlanSlice.setDocument(documentData));
      dispatch(FloorPlanSlice.markClean());
      return documentData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load floor plan";
      dispatch(FloorPlanSlice.setError(errorMessage));
      throw error;
    } finally {
      dispatch(FloorPlanSlice.setLoading(false));
    }
  }
);

export default { openDrawing, saveDrawing, loadFloorPlan };