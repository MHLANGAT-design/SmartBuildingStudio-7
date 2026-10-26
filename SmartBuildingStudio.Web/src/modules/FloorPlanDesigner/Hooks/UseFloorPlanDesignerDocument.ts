// src/modules/FloorPlanDesigner/Hooks/UseFloorPlanDesignerDocument.ts
//
// Consolidated: Rules-of-Hooks compliant. All hooks called unconditionally.
// Document instance is reused only when the document id matches.
//
// Wall-id safety net: `loadFromState` calls `WallsRepository.add` for
// every wall in `document.walls`, and the repository throws on
// duplicate ids. Old documents (imported before the composer
// uniquified wall ids) may carry duplicates. We dedupe here, before
// loadFromState, so the load cannot throw on a data-quality issue the
// user cannot fix by re-importing.

import { useMemo, useState } from "react";
import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";
import { useFloorPlanFetching } from "@/modules/FloorPlanDesigner/Hooks/UseFloorPlanFetching";
import { UseCanvasRedrawing } from "@/modules/FloorPlanDesigner/Hooks/UseCanvasRedrawing";

interface UseDocumentProps {
  urlDocumentId: string | null;
  mode: string;
}

/**
 * Ensure `state.walls` has unique ids. Preserves every wall (no
 * geometry loss) — duplicates get `-2`, `-3`, ... suffixes. Non-wall
 * arrays pass through unchanged.
 *
 * Returns a shallow-copied document when any id needed uniquifying,
 * the original reference otherwise.
 */
function sanitizeWallIds(state: any): any {
  if (!state || !Array.isArray(state.walls) || state.walls.length === 0) {
    return state;
  }

  const used = new Set<string>();
  let changed = false;
  const sanitizedWalls = state.walls.map((w: any) => {
    const id = String(w?.id ?? "");
    if (!id) return w; // keep id-less walls as-is; they don't collide
    if (!used.has(id)) {
      used.add(id);
      return w;
    }
    // Collision — pick a unique variant.
    let n = 2;
    while (used.has(`${id}-${n}`)) n++;
    const variant = `${id}-${n}`;
    used.add(variant);
    changed = true;
    return { ...w, id: variant };
  });

  return changed ? { ...state, walls: sanitizedWalls } : state;
}

export const UseFloorPlanDesignerDocument = ({ urlDocumentId, mode }: UseDocumentProps) => {
  const [renderError, setRenderError] = useState<Error | null>(null);

  // ── HOOK 1: fetch ────────────────────────────────────────────────────────
  const {
    documentId,
    isLoading,
    error,
    activeDocumentState: fetchedState,
  } = useFloorPlanFetching();

  const activeDocumentState = useMemo(() => {
    if (typeof fetchedState !== "string") return fetchedState;
    try {
      return JSON.parse(fetchedState);
    } catch (e) {
      console.error(
        "[FloorPlanDesignerDocument] Failed parsing activeDocumentState JSON string",
        e
      );
      return null;
    }
  }, [fetchedState]);

  const effectiveDocumentState = mode === "import" ? null : activeDocumentState;
  const effectiveIsLoading = mode === "import" ? false : isLoading;
  const effectiveError = mode === "import" ? null : error;

  // ── HOOK 2: canvas redraw ────────────────────────────────────────────────
  const globalDocInstance =
    typeof window !== "undefined"
      ? (window as any).__floorPlanActiveDocumentInstance
      : null;

  UseCanvasRedrawing(
    mode !== "import" ? effectiveDocumentState : null,
    mode !== "import" ? globalDocInstance : null
  );

  // ── HOOK 3: drawing document instance ────────────────────────────────────
  const drawingDocInstance = useMemo(() => {
    const globalContext = (window as any).__floorPlanActiveDocumentInstance;
    const treeNodeDocumentName =
      effectiveDocumentState?.name ||
      globalContext?.activeDocumentName ||
      (window as any).__activeDocumentContext?.documentName ||
      "Blueprint";

    // ── Import mode ────────────────────────────────────────────────────────
    if (mode === "import") {
      console.log(
        `[Document Loader Hook]: Import Mode active. Forcing constructor lock on target GUID: ${urlDocumentId}`
      );

      const doc = new DrawingDocument({
        id: urlDocumentId || `doc-${Date.now()}`,
        units: "mm",
        activeProjectId: (window as any).__activeDocumentContext?.projectId || "",
        activeProjectName:
          (window as any).__activeDocumentContext?.projectName || "Unknown Project",
        activeBuildingId: (window as any).__activeDocumentContext?.buildingId || "",
        activeBuildingName:
          (window as any).__activeDocumentContext?.buildingName || "Unknown Building",
        activeFloorId: (window as any).__activeDocumentContext?.floorId || "",
        activeFloorName:
          (window as any).__activeDocumentContext?.floorName || "Unknown Floor",
        activeDocumentName: treeNodeDocumentName,
      } as any);

      doc.id = urlDocumentId;
      if (typeof doc.setId === "function") {
        try {
          (doc as any).setId(urlDocumentId);
        } catch (e) {
          /* ignore */
        }
      }
      doc.activeDocumentName = treeNodeDocumentName;

      (window as any).__floorPlanActiveDocumentInstance = doc;
      (window as any).__activeDocumentId = urlDocumentId;
      return doc;
    }

    // ── Edit mode ──────────────────────────────────────────────────────────
    const currentId = String(effectiveDocumentState?.id ?? "");
    const instanceId = String(globalContext?.getId?.() ?? "");
    const idsMatch = currentId && instanceId && currentId === instanceId;

    try {
      // ── Reuse existing instance when the id matches ────────────────────
      if (idsMatch) {
        if (
          effectiveDocumentState &&
          typeof globalContext.loadFromState === "function"
        ) {
          globalContext.loadFromState(sanitizeWallIds(effectiveDocumentState));
        }
        globalContext.activeDocumentName = treeNodeDocumentName;
        return globalContext;
      }

      // ── Otherwise: build a new instance for the incoming document ──────
      const doc = new DrawingDocument({
        id: urlDocumentId || effectiveDocumentState?.id || `doc-${Date.now()}`,
        units: effectiveDocumentState?.units || "mm",
        activeProjectId:
          effectiveDocumentState?.activeProjectId ||
          globalContext?.activeProjectId ||
          "",
        activeProjectName:
          effectiveDocumentState?.activeProjectName ||
          globalContext?.activeProjectName ||
          "Unknown Project",
        activeBuildingId:
          effectiveDocumentState?.activeBuildingId ||
          globalContext?.activeBuildingId ||
          "",
        activeBuildingName:
          globalContext?.activeBuildingName || "Unknown Building",
        activeFloorId:
          effectiveDocumentState?.activeFloorId ||
          globalContext?.activeFloorId ||
          "",
        activeFloorName: globalContext?.activeFloorName || "Unknown Floor",
        activeDocumentName: treeNodeDocumentName,
      } as any);

      if (
        effectiveDocumentState &&
        typeof doc.loadFromState === "function"
      ) {
        doc.loadFromState(sanitizeWallIds(effectiveDocumentState));
      }

      doc.id = urlDocumentId || effectiveDocumentState?.id;
      doc.activeDocumentName = treeNodeDocumentName;

      (window as any).__floorPlanActiveDocumentInstance = doc;
      return doc;
    } catch (err) {
      setRenderError(
        err instanceof Error ? err : new Error("Failed to create document instance")
      );
      return null;
    }
  }, [effectiveDocumentState, documentId, urlDocumentId, mode]);

  return {
    drawingDocInstance,
    effectiveDocumentState,
    effectiveIsLoading,
    effectiveError,
    renderError,
    setRenderError,
  };
};