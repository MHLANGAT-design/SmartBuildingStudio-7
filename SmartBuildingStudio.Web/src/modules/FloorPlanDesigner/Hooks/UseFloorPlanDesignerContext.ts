// src/modules/FloorPlanDesigner/Hooks/UseFloorPlanDesignerContext.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/Application/ConfigureStore";
import { setDocument } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";

const EMPTY_DOCUMENT = Object.freeze({});

export const UseFloorPlanDesignerContext = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  const [refreshKey, setRefreshKey] = useState(0);

  // 1. EXTRACT URL PARAMETERS
  const urlDocumentId = searchParams.get('documentId') || searchParams.get('id');
  const rawMode = searchParams.get('mode') || 'floorplans';
  const mode = rawMode === 'edit' ? 'floorplans' : rawMode;

  // ── Fix 2a: stable empty object when the slice is empty ───────────────
  // `state.floorPlan?.document || {}` returns a new `{}` every render
  // when `document` is undefined, which invalidates every downstream
  // useMemo — including usePlanRenderer's 19k-element transform.
  const currentDocument = useAppSelector(
    (state: any) => state.floorPlan?.document ?? EMPTY_DOCUMENT
  );

  const contextRef = useRef<any>(null);
  const hasClearedRef = useRef(false);

  // ── Fix 1: don't re-render FloorPlanDesigner on every canvas event ────
  // The hook used to bump `refreshKey` state on every sbs:canvas-update.
  // That re-rendered the entire FloorPlanDesigner tree (including the
  // canvas and its 19k-element plan) for every event. The value is not
  // consumed by anyone, so we keep a ref instead of state — no re-render.
  const refreshKeyRef = useRef(0);
  useEffect(() => {
    const handleUpdate = () => {
      refreshKeyRef.current += 1;
      // Intentionally no console.log here. In dev this fires on every
      // dispatch and produces hundreds of lines.
    };
    window.addEventListener('sbs:canvas-update', handleUpdate);
    window.addEventListener('canvas-invalidate', handleUpdate);
    return () => {
      window.removeEventListener('sbs:canvas-update', handleUpdate);
      window.removeEventListener('canvas-invalidate', handleUpdate);
    };
  }, []);

  // 3. STORAGE PERSISTENCE — depends on currentDocument which is now
  //    stable across renders when the document hasn't changed.
  useEffect(() => {
    const ctx = {
      id: urlDocumentId || currentDocument.id,
      name: currentDocument.name,
      activeProjectName: currentDocument.activeProjectName,
      activeBuildingName: currentDocument.activeBuildingName,
      activeFloorName: currentDocument.activeFloorName,
      projectId: currentDocument.projectId,
      buildingId: currentDocument.buildingId,
      floorId: currentDocument.floorId,
    };
    if (ctx.id) {
      contextRef.current = ctx;
      sessionStorage.setItem('floorPlanContext', JSON.stringify(ctx));
    }
  }, [currentDocument, urlDocumentId]);

  // 4. WORKSPACE MODE ROUTING — unchanged.
  useEffect(() => {
    (window as any).__designerMode = mode;
    if (mode === 'import') {
      const restored =
        contextRef.current ||
        JSON.parse(sessionStorage.getItem('floorPlanContext') || '{}');
      if (restored.id && !hasClearedRef.current) {
        dispatch(
          setDocument({
            ...restored,
            walls: [],
            doors: [],
            windows: [],
            rooms: [],
            importedDrawings: [],
            electricalFixtures: [],
          })
        );
        (window as any).__floorPlanActiveDocumentInstance = null;
        hasClearedRef.current = true;
      }
      (window as any).__showImportDialog = true;
    } else {
      (window as any).__showImportDialog = false;
      hasClearedRef.current = false;
    }
  }, [mode, dispatch]);

  // 5. GLOBAL LOOKUP LINKING — unchanged.
  useEffect(() => {
    if (urlDocumentId) (window as any).__activeDocumentId = urlDocumentId;
  }, [urlDocumentId]);

  return {
    urlDocumentId,
    mode,
    currentDocument,
    refreshKey: refreshKeyRef.current,
    contextRef,
  };
};