// src/modules/DaliDesigner/DaliDesignerPage.tsx

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
import { selectDocumentFresh } from "@/modules/Shared/DocumentVersion/selectDocumentFresh";

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

  const sliceMatchesUrl =
    !!storeFloorplanId &&
    !!floorplanId &&
    storeFloorplanId === floorplanId &&
    (!networkId || documentId === networkId);

  const floorplanModelId = (floorplanModel as any)?.documentId ?? null;
  const floorplanReady =
    floorplanStatus === "ready" &&
    !!floorplanModel &&
    !!floorplanId &&
    floorplanModelId === floorplanId;

  // Freshness check — if the underlying document hasn't changed since we
  // last loaded it, and the DALI slice already matches the URL, we can
  // skip the reload entirely.
  const isFresh = useAppSelector(selectDocumentFresh(floorplanId || ""));

  // ── Reset before paint on cache miss ────────────────────────────────
  useLayoutEffect(() => {
    if (!floorplanId) return;
    if (sliceMatchesUrl && floorplanReady) return;
    dispatch(resetDaliDocument());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, floorplanId, networkId]);

  // ── Load DALI network on cache miss ─────────────────────────────────
  // Unchanged from before — network reloads can lose unsaved device
  // edits, so freshness for the network is gated by sliceMatchesUrl
  // (which includes documentId === networkId).
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
  // Now freshness-gated: if the document version has changed since we
  // last loaded the floorplan (e.g. FPS saved fixtures), force reload.
  useEffect(() => {
    if (!floorplanId) return;
    if (floorplanStatus === "loading") return;
    if (floorplanReady && isFresh) return;
    dispatch(loadFloorplan({ floorplanId }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, floorplanId, floorplanStatus, floorplanReady, isFresh]);

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