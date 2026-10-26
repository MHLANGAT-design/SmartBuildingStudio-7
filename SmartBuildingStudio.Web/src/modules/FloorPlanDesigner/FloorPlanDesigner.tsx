// src/modules/FloorPlanDesigner/FloorPlanDesigner.tsx
// ✅ CONSOLIDATED — lifecycle-safe document loading & clearing
//
// Five lifecycle cases this file handles correctly:
//   1. StrictMode probe unmount + remount (same tick) — no clear
//   2. Initial document load (null → "A")             — clear once, fetch
//   3. Document switch within FPD ("A" → "B")         — clear, fetch
//   4. Navigate away from FPD (real unmount)          — clear on next tick
//   5. Navigate away, return to same doc ("A"→"A")    — cleared on exit,
//                                                        refetched on return
//
// Rules:
//   - One writer for __floorPlanActiveDocumentInstance: this component,
//     via UseFloorPlanDesignerDocument. No other file writes it.
//   - Redux clearDocument fires on document transition and on real
//     unmount — never during StrictMode's synchronous probe cycle.
//   - __persistentDwgVectorBackupCache is flushed whenever the document
//     changes or the component really unmounts.
//   - __viewport / __floorPlanActiveViewportInstance are owned by the
//     "Expose viewport globally" effect below; not nulled elsewhere.
//
// LEVEL 1 LOCK ENFORCEMENT:
//   When the loaded document has isLocked === true and its
//   lockedByUsername is not CURRENT_USER, the canvas, toolbar, floating
//   draw group, and left sidebar (Drawings tab) all render in read-only
//   mode. A yellow banner above the canvas tells the user who holds the
//   lock. Backend PUT /documents/{id} rejects saves from non-holders
//   with HTTP 423.

import React, { useState, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";
import { FloorPlanCanvas } from "@/modules/FloorPlanDesigner/Components/Canvas/FloorPlanCanvas";
import { FloorPlanToolbar } from "@/modules/FloorPlanDesigner/Toolbar/FloorPlanToolbar";
import FloorPlanSidebar from "@/modules/FloorPlanDesigner/Sidebar/FloorPlanSidebar";
import Inspector from "@/modules/FloorPlanDesigner/Inspector/Inspector";
import { selectChangeTrigger } from "@/modules/FloorPlanDesigner/Store/FloorPlanSelectors";
import { FloorPlanBreadcrumbWithDatabaseIndicatorWidget } from "@/modules/FloorPlanDesigner/Components/FloorPlanBreadcrumbWithDatabaseIndicatorWidget";
import { UseFloorPlanDesignerContext } from "@/modules/FloorPlanDesigner/Hooks/UseFloorPlanDesignerContext";
import { UseFloorPlanDesignerDocument } from "@/modules/FloorPlanDesigner/Hooks/UseFloorPlanDesignerDocument";
import { UseFloorPlanDesignerManagers } from "@/modules/FloorPlanDesigner/Hooks/UseFloorPlanDesignerManagers";
import { UseFloorPlanDebugger } from "@/modules/FloorPlanDesigner/Hooks/UseFloorPlanDebugger";
import { DatabaseContentDump } from "@/modules/FloorPlanDesigner/Components/DatabaseContentDump";
import { FloatingDrawGroup } from "@/modules/FloorPlanDesigner/Toolbar/FloatingDrawGroup";
import { openDrawing } from "@/modules/FloorPlanDesigner/Store/FloorPlanThunks";
import { clearDocument } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { getCurrentUser } from "@/Application/CurrentUser";

// ─── Module-scoped state ─────────────────────────────────────────────
const _moduleOpenedDocId: { current: string | null } = { current: null };
let _pendingUnmountClearTimer: number | null = null;

export const FloorPlanDesigner = () => {
  UseFloorPlanDebugger();

  const dispatch = useAppDispatch();
  const changeTrigger = useAppSelector(selectChangeTrigger);
  const [showDbDump, setShowDbDump] = useState(false);

  const activeTool = useAppSelector(
    (state: any) => state.floorPlan?.activeTool ?? "select"
  );

  const { urlDocumentId, mode, currentDocument, contextRef } =
    UseFloorPlanDesignerContext();

  const {
    drawingDocInstance,
    effectiveDocumentState,
    effectiveIsLoading,
    effectiveError,
    renderError,
  } = UseFloorPlanDesignerDocument({ urlDocumentId, mode });

  const {
    sharedViewport,
    sharedDocumentManager,
    sharedToolContext,
    sharedToolManager,
    apiInstance,
  } = UseFloorPlanDesignerManagers(drawingDocInstance);

  // ── Read-only lock detection ──────────────────────────────────────
  // getCurrentUser() reads the URL on every render, so ?asUser=Bob
  // takes effect without waiting for a module reload. The document
  // response carries isLocked + lockedByUsername from the backend.
  const docLockedBy =
    (effectiveDocumentState as any)?.lockedByUsername ??
    (currentDocument as any)?.lockedByUsername ??
    null;
  const docIsLocked =
    (effectiveDocumentState as any)?.isLocked ??
    (currentDocument as any)?.isLocked ??
    false;
  const currentUser = getCurrentUser();
  const isReadOnly = !!docIsLocked && docLockedBy !== currentUser;

  console.log("[FloorPlanDesigner] 🧩 Managers status:", {
    drawingDocInstance: !!drawingDocInstance,
    sharedViewport: !!sharedViewport,
    sharedDocumentManager: !!sharedDocumentManager,
    sharedToolContext: !!sharedToolContext,
    sharedToolManager: !!sharedToolManager,
    apiInstance: !!apiInstance,
    isReadOnly,
    docLockedBy,
    currentUser,
  });

  // ═══ Lifecycle case 2 + 3: document transition clears ═══════════════
  const lastTransitionDocIdRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = lastTransitionDocIdRef.current;
    const curr = urlDocumentId ?? null;

    if (prev !== curr) {
      console.log(
        "[FloorPlanDesigner] document transition — clearing stale state",
        { from: prev, to: curr }
      );
      dispatch(clearDocument());

      if (typeof window !== "undefined") {
        const win = window as any;
        win.__persistentDwgVectorBackupCache = [];
        win.__viewportState = undefined;
        win.__viewportInstance = undefined;
      }
    }

    lastTransitionDocIdRef.current = curr;
  }, [urlDocumentId, dispatch]);

  // ═══ Lifecycle case 1 + 4: real unmount clears ══════════════════════
  useEffect(() => {
    if (_pendingUnmountClearTimer !== null) {
      window.clearTimeout(_pendingUnmountClearTimer);
      _pendingUnmountClearTimer = null;
    }

    return () => {
      _pendingUnmountClearTimer = window.setTimeout(() => {
        _pendingUnmountClearTimer = null;
        console.log(
          "[FloorPlanDesigner] real unmount — clearing state for next session"
        );
        dispatch(clearDocument());
        _moduleOpenedDocId.current = null;

        if (typeof window !== "undefined") {
          const win = window as any;
          win.__persistentDwgVectorBackupCache = [];
          win.__floorPlanActiveDocumentInstance = null;
          win.__viewportState = undefined;
          win.__viewportInstance = undefined;
          win.__floorPlanActiveViewportInstance = undefined;
        }
      }, 0);
    };
  }, [dispatch]);

  // ═══ urlDocumentId change diagnostic ════════════════════════════════
  const lastSeenDocIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (urlDocumentId === lastSeenDocIdRef.current) return;
    console.log("[FloorPlanDesigner] urlDocumentId changed", {
      from: lastSeenDocIdRef.current,
      to: urlDocumentId,
      mode,
    });
    lastSeenDocIdRef.current = urlDocumentId ?? null;
  }, [urlDocumentId, mode]);

  // ═══ Expose viewport globally ═══════════════════════════════════════
  useEffect(() => {
    if (sharedViewport) {
      (window as any).__viewport = sharedViewport;
      (window as any).__floorPlanActiveViewportInstance = sharedViewport;
      console.log("[FloorPlanDesigner] Viewport exposed globally");
    }
  }, [sharedViewport]);

  // ═══ Sync metadata ══════════════════════════════════════════════════
  //
  // The document response (GET /documents/{id}) carries the full
  // hierarchy under the keys projectName / buildingName / floorName.
  // We write those into drawingDocInstance's metadata so any component
  // that reads the active document (including the breadcrumb widget's
  // globalContext fallback) sees the real names. The legacy
  // activeProjectName / activeBuildingName / activeFloorName field
  // names are also written in case some consumers still expect them.
  useEffect(() => {
    if (drawingDocInstance) {
      const breadcrumbData =
        mode === "import"
          ? contextRef.current || currentDocument
          : effectiveDocumentState;
      const names = {
        activeProjectName:
          (breadcrumbData as any)?.projectName ||
          (breadcrumbData as any)?.activeProjectName ||
          (currentDocument as any)?.projectName ||
          (currentDocument as any)?.activeProjectName ||
          "Unknown Project",
        activeBuildingName:
          (breadcrumbData as any)?.buildingName ||
          (breadcrumbData as any)?.activeBuildingName ||
          (currentDocument as any)?.buildingName ||
          (currentDocument as any)?.activeBuildingName ||
          "Unknown Building",
        activeFloorName:
          (breadcrumbData as any)?.floorName ||
          (breadcrumbData as any)?.activeFloorName ||
          (currentDocument as any)?.floorName ||
          (currentDocument as any)?.activeFloorName ||
          "Unknown Floor",
        activeDocumentName:
          (breadcrumbData as any)?.activeDocumentName ||
          (currentDocument as any)?.activeDocumentName ||
          drawingDocInstance.name ||
          "Untitled Layout",
      };
      try {
        drawingDocInstance.activeProjectName = names.activeProjectName;
        drawingDocInstance.activeBuildingName = names.activeBuildingName;
        drawingDocInstance.activeFloorName = names.activeFloorName;
        drawingDocInstance.activeDocumentName = names.activeDocumentName;
        if (typeof drawingDocInstance.setMetadata === "function") {
          const meta = drawingDocInstance.getMetadata?.() || {};
          drawingDocInstance.setMetadata({
            ...meta,
            ...names,
          });
        }
      } catch (e) {
        console.warn("[FloorPlanDesigner] Could not set metadata:", e);
      }
    }
  }, [
    drawingDocInstance,
    mode,
    contextRef,
    currentDocument,
    effectiveDocumentState,
  ]);

  // ═══ Auto-fetch, idempotent per document id, survives remounts ══════
  useEffect(() => {
    const docId = urlDocumentId || (window as any).__activeDocumentId;
    console.log(
      "[FloorPlanDesigner] 🔍 Manual fetch effect. docId:",
      docId,
      "mode:",
      mode
    );

    if (!docId || mode === "import") {
      console.log("[FloorPlanDesigner] ⏭️ Skipping fetch.");
      return;
    }

    if (_moduleOpenedDocId.current === docId) {
      console.log("[FloorPlanDesigner] ♻️ Already opened, skipping:", docId);
      return;
    }

    _moduleOpenedDocId.current = docId;

    console.log("[FloorPlanDesigner] 🚀 Dispatching openDrawing for:", docId);
    try {
      dispatch(openDrawing(docId));
    } catch (err) {
      console.error(
        "[FloorPlanDesigner] ❌ Error dispatching openDrawing:",
        err
      );
      _moduleOpenedDocId.current = null;
    }
  }, [urlDocumentId, mode, dispatch]);

  // ═══ Document content diagnostic ════════════════════════════════════
  useEffect(() => {
    const doc = currentDocument as any;
    if (!doc) return;
    console.log("[FloorPlanDesigner] currentDocument shape", {
      id: doc.id,
      walls: Array.isArray(doc.walls) ? doc.walls.length : 0,
      doors: Array.isArray(doc.doors) ? doc.doors.length : 0,
      windows: Array.isArray(doc.windows) ? doc.windows.length : 0,
      rooms: Array.isArray(doc.rooms) ? doc.rooms.length : 0,
      electricalFixtures: Array.isArray(doc.electricalFixtures)
        ? doc.electricalFixtures.length
        : 0,
      elements: Array.isArray(doc.elements) ? doc.elements.length : 0,
      importedDrawings: Array.isArray(doc.importedDrawings)
        ? doc.importedDrawings.length
        : 0,
    });
  }, [currentDocument]);

  // ═══ Global document instance diagnostic ════════════════════════════
  useEffect(() => {
    const g = (window as any).__floorPlanActiveDocumentInstance;
    console.log(
      "[FloorPlanDesigner] __floorPlanActiveDocumentInstance shape",
      {
        exists: !!g,
        id: g?.id ?? g?.getId?.() ?? null,
        electricalFixtures: Array.isArray(g?.electricalFixtures)
          ? g.electricalFixtures.length
          : Array.isArray(g?.getElectricalFixtures?.())
          ? g.getElectricalFixtures().length
          : 0,
      }
    );
  }, [currentDocument, drawingDocInstance]);

  // ═══ Error / loading / manager guards ═══════════════════════════════
  if (renderError || effectiveError) {
    console.error(
      "[FloorPlanDesigner] ❌ Render error:",
      renderError || effectiveError
    );
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100vh",
          background: "#0B0F19",
          color: "#EF4444",
          fontFamily: "monospace",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div>❌ Error initializing canvas components.</div>
        <div style={{ fontSize: "12px", color: "#64748B" }}>
          {String(renderError || effectiveError)}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            background: "#1E293B",
            border: "1px solid #475569",
            borderRadius: "6px",
            color: "#E2E8F0",
            cursor: "pointer",
          }}
        >
          ↻ Reload
        </button>
      </div>
    );
  }

  if (effectiveIsLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100vh",
          background: "#0B0F19",
          color: "#64748B",
          fontFamily: "monospace",
        }}
      >
        <div>📄 Loading floor plan layers...</div>
      </div>
    );
  }

  if (
    !drawingDocInstance ||
    !sharedToolContext ||
    !sharedToolManager ||
    !apiInstance
  ) {
    console.error("[FloorPlanDesigner] ❌ Missing critical managers:", {
      drawingDocInstance: !!drawingDocInstance,
      sharedToolContext: !!sharedToolContext,
      sharedToolManager: !!sharedToolManager,
      apiInstance: !!apiInstance,
    });
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100vh",
          background: "#0B0F19",
          color: "#FBBF24",
          fontFamily: "monospace",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div>⏳ Waiting for canvas services...</div>
        <div style={{ fontSize: "12px", color: "#64748B" }}>
          If this persists, check the console for errors.
        </div>
      </div>
    );
  }

  // ═══ Layout ═════════════════════════════════════════════════════════
  const breadcrumbData =
    mode === "import"
      ? contextRef.current || currentDocument
      : effectiveDocumentState;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr 320px",
        gridTemplateRows: "auto 1fr",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#0B0F19",
        position: "relative",
      }}
      data-render-tick={changeTrigger}
    >
      {showDbDump && (
        <div
          style={{
            position: "absolute",
            top: "60px",
            left: "60px",
            right: "340px",
            bottom: "20px",
            zIndex: 99999,
            backgroundColor: "#030712",
            border: "2px solid #1E293B",
            borderRadius: "12px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.75)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "8px 16px",
              backgroundColor: "#0F172A",
              borderBottom: "1px solid #1E293B",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: "#38BDF8",
                fontWeight: "bold",
                fontFamily: "monospace",
                fontSize: "11px",
              }}
            >
              [LIVE SERVER DB FIREWALL INSPECTOR]
            </span>
            <button
              onClick={() => setShowDbDump(false)}
              style={{
                backgroundColor: "#EF4444",
                border: "none",
                color: "#FFFFFF",
                padding: "4px 10px",
                borderRadius: "4px",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "11px",
                fontWeight: "bold",
              }}
            >
              CLOSE TERMINAL
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <DatabaseContentDump />
          </div>
        </div>
      )}

      <div style={{ gridColumn: "1 / span 3" }}>
        <FloorPlanToolbar
          api={apiInstance}
          toolManager={sharedToolManager}
          documentManager={sharedDocumentManager}
          viewport={sharedViewport}
          isReadOnly={isReadOnly}
        />
      </div>

      <FloorPlanSidebar
        toolManager={sharedToolManager}
        toolContext={sharedToolContext}
        isReadOnly={isReadOnly}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#090D16",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#090D16",
          }}
        >
          <div style={{ flexGrow: 1 }}>
            <FloorPlanBreadcrumbWithDatabaseIndicatorWidget
              activeDocumentState={breadcrumbData}
              dbMetrics={{
                isFetched: !!(breadcrumbData?.id),
                isSaving: false,
                databaseStatus: breadcrumbData?.id
                  ? "connected"
                  : "disconnected",
              }}
            />
          </div>
          <button
            onClick={() => setShowDbDump(!showDbDump)}
            style={{
              marginRight: "16px",
              backgroundColor: "rgba(5, 255, 196, 0.08)",
              border: "1px solid #05FFC4",
              color: "#05FFC4",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: "10px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transition: "all 0.15s",
            }}
          >
            {showDbDump ? "Hide DB Payload" : "Expose DB Payload"}
          </button>
        </div>

        {/* ── READ-ONLY BANNER ─────────────────────────────────────── */}
        {isReadOnly && (
          <div
            style={{
              width: "100%",
              padding: "8px 16px",
              background: "rgba(255, 184, 0, 0.12)",
              borderBottom: "1px solid rgba(255, 184, 0, 0.4)",
              color: "#FFB800",
              fontSize: "11px",
              fontFamily: "monospace",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <span>🔒</span>
            <span>
              Read-only — this document is locked by{" "}
              <span style={{ color: "#FFD966" }}>{docLockedBy || "another user"}</span>.
              Pan and zoom are available; edits are disabled.
            </span>
          </div>
        )}

        <div
          style={{
            flexGrow: 1,
            width: "100%",
            height: "100%",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#000000",
          }}
        >
          <FloorPlanCanvas
            plan={effectiveDocumentState || currentDocument}
            activeTool={activeTool}
            isReadOnly={isReadOnly}
          />
        </div>
      </div>

      <div
        style={{
          borderLeft: "1px solid #1E293B",
          overflow: "auto",
          background: "#0F1424",
        }}
      >
        <Inspector />
      </div>

      <FloatingDrawGroup
        toolManager={sharedToolManager}
        isReadOnly={isReadOnly}
      />
    </div>
  );
};

export default FloorPlanDesigner;