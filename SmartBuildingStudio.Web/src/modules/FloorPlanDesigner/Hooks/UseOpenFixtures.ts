// src/modules/FloorPlanDesigner/Hooks/UseOpenFixtures.ts
//
// Navigates from FloorPlanDesigner into FixturePlacementStudio for the
// currently-open document. Saves unsaved changes first via the same
// save path the toolbar and sidebar use, then redirects with the full
// ActivationContext so the studio can load in one shot.

import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppSelector } from "@/Application/ConfigureStore";
import { UseFloorPlanSaving } from "@/modules/FloorPlanDesigner/Hooks/UseFloorPlanSaving";

export function UseOpenFixtures() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { saveWorkspaceData, isDirty, isSaving } = UseFloorPlanSaving();
  const [isOpening, setIsOpening] = useState(false);

  const floorPlanState = useAppSelector((s: any) => s.floorPlan);
  const document = floorPlanState?.document || {};

  const handleOpenFixtures = useCallback(async () => {
    if (isOpening) return;
    setIsOpening(true);

    // ── 1. Resolve the current document id ───────────────────────────
    const documentId =
      document.id ||
      searchParams.get("documentId") ||
      (window as any).__activeDocumentId ||
      "";

    if (!documentId) {
      console.warn(
        "[UseOpenFixtures] No documentId available; cannot open FixturePlacementStudio."
      );
      setIsOpening(false);
      return;
    }

    // ── 2. Save first if there are unsaved changes ───────────────────
    // Best-effort. If the save fails, we still proceed — the user's
    // intent is to switch studios, and the studio can re-save the
    // document from its own save flow. We warn instead of blocking.
    if (isDirty && !isSaving) {
      try {
        await saveWorkspaceData();
      } catch (err) {
        console.warn("[UseOpenFixtures] Save before switch failed:", err);
      }
    }

    // ── 3. Collect hierarchy context ─────────────────────────────────
    // FloorPlanSlice stores these with an `active` prefix
    // (activeProjectId, activeBuildingId, activeFloorId). The URL
    // may also carry them from the original ProjectExplorer launch,
    // and window globals may have the same info. Prefer in that order.
    const projectId =
      (document as any).projectId ||
      (document as any).activeProjectId ||
      searchParams.get("projectId") ||
      (window as any).__activeDocumentContext?.projectId ||
      "";

    const buildingId =
      (document as any).buildingId ||
      (document as any).activeBuildingId ||
      searchParams.get("buildingId") ||
      (window as any).__activeDocumentContext?.buildingId ||
      "";

    const floorId =
      (document as any).floorId ||
      (document as any).activeFloorId ||
      searchParams.get("floorId") ||
      (window as any).__activeDocumentContext?.floorId ||
      "";

    const revision = searchParams.get("revision") || "0";

    // ── 4. Navigate ──────────────────────────────────────────────────
    const params = new URLSearchParams({
      documentId,
      mode: "fixtures",
      projectId,
      buildingId,
      floorId,
      revision,
    });

    console.log(
      `[UseOpenFixtures] Opening FixturePlacementStudio for document ${documentId}`,
      { projectId, buildingId, floorId, revision }
    );

    navigate(`/designer?${params.toString()}`);
  }, [
    document,
    isDirty,
    isOpening,
    isSaving,
    navigate,
    saveWorkspaceData,
    searchParams,
  ]);

  return { handleOpenFixtures, isOpening };
}