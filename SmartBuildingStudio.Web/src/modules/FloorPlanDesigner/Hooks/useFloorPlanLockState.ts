// src/modules/FloorPlanDesigner/hooks/useFloorPlanLockState.ts
//
// Fetches the lock state of the current FPD document from the
// ProjectExplorer bridge (GET /documents/{id}).
//
// The floorplanId is the document id used by every designer module
// (FPD, FPS, DALI). When the source floor plan is locked in FPD, DALI
// networks on that floorplan are also locked — same document, same lock.
//
// Source of the id, in priority order:
//   1. URL route param `floorplanId`  — available on the first render,
//      works before the document has finished loading.
//   2. Redux `floorPlan.document.id`  — fallback for routes without
//      a floorplanId param (e.g. embedded editors).
//
// Reads from useParams first so the badge renders on mount even while
// loadFloorPlan is still in flight.

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "@/Application/ConfigureStore";
import { getCurrentUser } from "@/Application/CurrentUser";

export interface FloorPlanLockState {
  isLocked: boolean;
  lockedByUsername: string | null;
  isReadOnly: boolean;
}

export function useFloorPlanLockState(): FloorPlanLockState {
  const { floorplanId: urlFloorplanId } = useParams<{
    floorplanId?: string;
  }>();

  const reduxFloorplanId = useAppSelector(
    (state: any) => state.floorPlan?.document?.id as string | undefined
  );

  // URL wins — it's available on render #1. Redux catches the case
  // where the module is embedded without a matching route param.
  const documentId = urlFloorplanId || reduxFloorplanId;

  const [lockState, setLockState] = useState<{
    isLocked: boolean;
    lockedByUsername: string | null;
  }>({ isLocked: false, lockedByUsername: null });

  useEffect(() => {
    if (!documentId) {
      setLockState({ isLocked: false, lockedByUsername: null });
      return;
    }

    let cancelled = false;
    fetch(`/api/v1/project-explorer/documents/${documentId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setLockState({
          isLocked: d.isLocked === true,
          lockedByUsername: d.lockedByUsername ?? null,
        });
      })
      .catch(() => {
        /* keep defaults: unlocked */
      });

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const currentUser = getCurrentUser();
  const isReadOnly =
    lockState.isLocked && lockState.lockedByUsername !== currentUser;

  return { ...lockState, isReadOnly };
}

export default useFloorPlanLockState;