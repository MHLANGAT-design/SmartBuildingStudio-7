// src/modules/DaliDesigner/hooks/useDaliLockState.ts
//
// Fetches the lock state of the current DALI document from the
// ProjectExplorer bridge (GET /documents/{id}).
//
// The floorplanId is the FPD document id (DALI networks live on a
// floorplan). So the lock applies to the same document across FPD,
// FPS, and DALI — a user who locked the floorplan in FPD also can't
// edit the DALI network on that floorplan.
//
// Reads floorplanId from the URL route, not from Redux, so it works
// on the very first render before loadDaliNetwork has fired.

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCurrentUser } from "@/Application/CurrentUser";

export interface DaliLockState {
  isLocked: boolean;
  lockedByUsername: string | null;
  isReadOnly: boolean;
}

export function useDaliLockState(): DaliLockState {
  const { floorplanId } = useParams<{ floorplanId: string }>();

  const [lockState, setLockState] = useState<{
    isLocked: boolean;
    lockedByUsername: string | null;
  }>({ isLocked: false, lockedByUsername: null });

  useEffect(() => {
    if (!floorplanId) {
      setLockState({ isLocked: false, lockedByUsername: null });
      return;
    }

    let cancelled = false;
    fetch(`/api/v1/project-explorer/documents/${floorplanId}`)
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
  }, [floorplanId]);

  const currentUser = getCurrentUser();
  const isReadOnly =
    lockState.isLocked && lockState.lockedByUsername !== currentUser;

  return { ...lockState, isReadOnly };
}

export default useDaliLockState;