// src/modules/FixturePlacementStudio/hooks/useFixtureLockState.ts
//
// Fetches the lock state of the current FPS document from the
// ProjectExplorer bridge (GET /documents/{id}). The DrawingDocument
// domain model doesn't carry isLocked / lockedByUsername — that
// information is session state, not document content — so we re-fetch
// it here.
//
// Returns:
//   • isLocked          — the backend's isLocked flag
//   • lockedByUsername  — whoever holds the lock
//   • isReadOnly        — true when locked by someone other than
//                         CURRENT_USER (see CurrentUser.ts)
//
// isReadOnly is what every FPS component gates on. The backend PUT
// endpoint enforces the same rule with HTTP 423, so this is UX
// gating only — data integrity is guaranteed even if a user bypasses
// the UI.

import { useEffect, useState } from "react";
import { useAppSelector } from "@/Application/ConfigureStore";
import { getCurrentUser } from "@/Application/CurrentUser";
import { selectLayout } from "@/modules/FixturePlacementStudio/store/fixtureSelectors";

export interface FixtureLockState {
  isLocked: boolean;
  lockedByUsername: string | null;
  isReadOnly: boolean;
}

export function useFixtureLockState(): FixtureLockState {
  const layout = useAppSelector(selectLayout);
  const documentId = layout?.documentId;

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

export default useFixtureLockState;