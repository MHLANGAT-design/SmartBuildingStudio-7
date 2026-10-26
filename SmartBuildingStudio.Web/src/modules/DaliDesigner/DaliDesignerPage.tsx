// src/modules/DaliDesigner/DaliDesignerPage.tsx
//
// Load orchestration — the page owns the full load sequence:
//   1. On cache miss: reset (pre-paint) → clear doc AND floorplan sub-state.
//   2. Fetch DALI network AND floorplan geometry in parallel.
//   3. Render only when BOTH are ready and match the URL.
//
// The DALI doc + floorplan geometry must be loaded atomically. Previously
// they loaded from two different components on two different schedules,
// so new DALI devices briefly rendered over old floorplan walls for the
// ~200ms gap between loadDaliNetwork.fulfilled and loadFloorplan.fulfilled.
// The page-level gate now blocks that window entirely.
//
// First-visit support: when the URL has no networkId (arriving from FPS's
// "Open DALI Designer" button, or any fresh visit), the slice is expected
// to hold an empty document with `id: null`. That's the valid "no saved
// network yet" state — the designer should open onto an empty canvas so
// the user can build one. The gate must not require a non-null documentId
// in that case, or it hangs on the loading screen forever.

import React, { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { DaliToolbar } from "@/modules/DaliDesigner/Toolbar/DaliToolbar";
import { DaliSidebar } from "@/modules/DaliDesigner/Sidebar/DaliSidebar";
import { DaliCanvas } from "@/modules/DaliDesigner/Canvas/DaliCanvas";
import { DaliInspector } from "@/modules/DaliDesigner/Inspector/DaliInspector";
import {
  loadDaliNetwork,
  loadFloorplan,
} from "@/modules/DaliDesigner/store/daliThunks";
import { resetDaliDocument } from "@/modules/DaliDesigner/store/daliSlice";
import { DaliApi } from "@/modules/DaliDesigner/services/DaliApi";
import {
  selectStatus,
  selectError,
  selectDocument,
  selectFloorplanModel,
  selectFloorplanStatus,
} from "@/modules/DaliDesigner/store/daliSelectors";

export function DaliDesignerPage() {
  const { projectId, floorplanId, networkId } = useParams<{
    projectId: string;
    floorplanId: string;
    networkId?: string;
  }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const status = useAppSelector(selectStatus);
  const error = useAppSelector(selectError);
  const documentId = useAppSelector(selectDocument).id;
  const storeFloorplanId = useAppSelector(
    (s: any) => s.dali?.document?.floorplanId ?? null
  );
  const floorplanModel = useAppSelector(selectFloorplanModel);
  const floorplanStatus = useAppSelector(selectFloorplanStatus);

  const [resolving, setResolving] = useState(false);

  // Slice holds the doc that matches the URL.
  // documentId may be null when no network exists yet — that's a valid
  // "fresh" state, and the designer should open onto an empty canvas.
  // Only require the id to match when the URL specifies one.
  const sliceMatchesUrl =
    !!storeFloorplanId &&
    !!floorplanId &&
    storeFloorplanId === floorplanId &&
    (!networkId || documentId === networkId);

  // FloorplanRenderModel.documentId is the ProjectDocument id (the
  // floorplanId), set by FloorplanLoader.load(). Compare it to the URL.
  const floorplanModelId = (floorplanModel as any)?.documentId ?? null;
  const floorplanReady =
    floorplanStatus === "ready" &&
    !!floorplanModel &&
    !!floorplanId &&
    floorplanModelId === floorplanId;

  // ── Reset before paint on cache miss ────────────────────────────────
  useLayoutEffect(() => {
    if (!floorplanId) return;
    if (sliceMatchesUrl && floorplanReady) return;
    dispatch(resetDaliDocument());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, floorplanId, networkId]);

  // ── Load DALI network on cache miss ─────────────────────────────────
  useEffect(() => {
    if (!projectId || !floorplanId) return;
    if (sliceMatchesUrl) return;

    if (networkId) {
      dispatch(loadDaliNetwork({ projectId, floorplanId, networkId }));
      return;
    }

    let cancelled = false;
    setResolving(true);
    DaliApi.listNetworksForFloorplan(projectId, floorplanId)
      .then((networks) => {
        if (cancelled) return;
        if (networks.length > 0) {
          navigate(
            `/projects/${projectId}/floorplans/${floorplanId}/dali/${networks[0].id}`,
            { replace: true }
          );
        } else {
          dispatch(loadDaliNetwork({ projectId, floorplanId }));
        }
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn("[DaliDesignerPage] network lookup failed:", e);
        dispatch(loadDaliNetwork({ projectId, floorplanId }));
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, projectId, floorplanId, networkId, navigate]);

  // ── Load floorplan geometry ─────────────────────────────────────────
  useEffect(() => {
    if (!floorplanId) return;
    if (floorplanStatus === "loading") return;
    if (floorplanReady) return;
    dispatch(loadFloorplan({ floorplanId }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, floorplanId, floorplanStatus, floorplanReady]);

  // ── Adopt loaded network id into URL ────────────────────────────────
  useEffect(() => {
    if (!projectId || !floorplanId) return;
    if (!documentId) return;
    if (networkId === documentId) return;
    if (storeFloorplanId !== floorplanId) return;

    navigate(
      `/projects/${projectId}/floorplans/${floorplanId}/dali/${documentId}`,
      { replace: true }
    );
  }, [documentId, networkId, storeFloorplanId, navigate, projectId, floorplanId]);

  // ── Render gate ─────────────────────────────────────────────────────
  if (
    status === "loading" ||
    !sliceMatchesUrl ||
    !floorplanReady ||
    resolving
  ) {
    return <div className="dali-loading">Loading DALI network…</div>;
  }
  if (error) {
    return <div className="dali-error">Error: {error}</div>;
  }

  return (
    <div
      className="dali-designer"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <DaliToolbar />
      <div
        className="dali-body"
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <DaliSidebar />
        <DaliCanvas />
        <DaliInspector />
      </div>
    </div>
  );
}

export default DaliDesignerPage;