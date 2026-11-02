// src/modules/FloorPlanDesigner/FloorPlanDesigner.tsx

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
import { clearDocument, setCalibrationDistance } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { getCurrentUser } from "@/Application/CurrentUser";
import CalibrationDialog from "@/modules/FloorPlanDesigner/Dialogs/CalibrationDialog";

const _moduleOpenedDocId: { current: string | null } = { current: null };
let _pendingUnmountClearTimer: number | null = null;

export const FloorPlanDesigner = () => {
  UseFloorPlanDebugger();

  const dispatch = useAppDispatch();
  const changeTrigger = useAppSelector(selectChangeTrigger);
  const [showDbDump, setShowDbDump] = useState(false);

  const activeTool = useAppSelector((state: any) => state.floorPlan?.activeTool ?? "select");

  const { urlDocumentId, mode, currentDocument, contextRef } = UseFloorPlanDesignerContext();

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

  const docLockedBy = (effectiveDocumentState as any)?.lockedByUsername ?? (currentDocument as any)?.lockedByUsername ?? null;
  const docIsLocked = (effectiveDocumentState as any)?.isLocked ?? (currentDocument as any)?.isLocked ?? false;
  const currentUser = getCurrentUser();
  const isReadOnly = !!docIsLocked && docLockedBy !== currentUser;

  const lastTransitionDocIdRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = lastTransitionDocIdRef.current;
    const curr = urlDocumentId ?? null;
    if (prev !== curr) {
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

  useEffect(() => {
    if (_pendingUnmountClearTimer !== null) {
      window.clearTimeout(_pendingUnmountClearTimer);
      _pendingUnmountClearTimer = null;
    }
    return () => {
      _pendingUnmountClearTimer = window.setTimeout(() => {
        _pendingUnmountClearTimer = null;
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

  const lastSeenDocIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (urlDocumentId === lastSeenDocIdRef.current) return;
    lastSeenDocIdRef.current = urlDocumentId ?? null;
  }, [urlDocumentId, mode]);

  useEffect(() => {
    if (sharedViewport) {
      (window as any).__viewport = sharedViewport;
      (window as any).__floorPlanActiveViewportInstance = sharedViewport;
    }
  }, [sharedViewport]);

  useEffect(() => {
    if (drawingDocInstance) {
      const breadcrumbData = mode === "import" ? contextRef.current || currentDocument : effectiveDocumentState;
      const names = {
        activeProjectName: (breadcrumbData as any)?.projectName || (breadcrumbData as any)?.activeProjectName || (currentDocument as any)?.projectName || (currentDocument as any)?.activeProjectName || "Unknown Project",
        activeBuildingName: (breadcrumbData as any)?.buildingName || (breadcrumbData as any)?.activeBuildingName || (currentDocument as any)?.buildingName || (currentDocument as any)?.activeBuildingName || "Unknown Building",
        activeFloorName: (breadcrumbData as any)?.floorName || (breadcrumbData as any)?.activeFloorName || (currentDocument as any)?.floorName || (currentDocument as any)?.activeFloorName || "Unknown Floor",
        activeDocumentName: (breadcrumbData as any)?.activeDocumentName || (currentDocument as any)?.activeDocumentName || drawingDocInstance.name || "Untitled Layout",
      };
      try {
        drawingDocInstance.activeProjectName = names.activeProjectName;
        drawingDocInstance.activeBuildingName = names.activeBuildingName;
        drawingDocInstance.activeFloorName = names.activeFloorName;
        drawingDocInstance.activeDocumentName = names.activeDocumentName;
        if (typeof drawingDocInstance.setMetadata === "function") {
          const meta = drawingDocInstance.getMetadata?.() || {};
          drawingDocInstance.setMetadata({ ...meta, ...names });
        }
      } catch (e) {
        console.warn("[FloorPlanDesigner] Could not set metadata:", e);
      }
    }
  }, [drawingDocInstance, mode, contextRef, currentDocument, effectiveDocumentState]);

  useEffect(() => {
    const docId = urlDocumentId || (window as any).__activeDocumentId;
    if (!docId || mode === "import") return;
    if (_moduleOpenedDocId.current === docId) return;
    _moduleOpenedDocId.current = docId;
    try {
      dispatch(openDrawing(docId));
    } catch (err) {
      _moduleOpenedDocId.current = null;
    }
  }, [urlDocumentId, mode, dispatch]);

  useEffect(() => {
    const doc = currentDocument as any;
    if (!doc) return;
  }, [currentDocument]);

  useEffect(() => {
    const g = (window as any).__floorPlanActiveDocumentInstance;
  }, [currentDocument, drawingDocInstance]);

  if (renderError || effectiveError) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100vh", background: "#0B0F19", color: "#EF4444", fontFamily: "monospace", flexDirection: "column", gap: "12px" }}>
        <div>❌ Error initializing canvas components.</div>
        <div style={{ fontSize: "12px", color: "#64748B" }}>{String(renderError || effectiveError)}</div>
        <button onClick={() => window.location.reload()} style={{ marginTop: "16px", padding: "8px 16px", background: "#1E293B", border: "1px solid #475569", borderRadius: "6px", color: "#E2E8F0", cursor: "pointer" }}>↻ Reload</button>
      </div>
    );
  }

  if (effectiveIsLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100vh", background: "#0B0F19", color: "#64748B", fontFamily: "monospace" }}>
        <div>📄 Loading floor plan layers...</div>
      </div>
    );
  }

  if (!drawingDocInstance || !sharedToolContext || !sharedToolManager || !apiInstance) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100vh", background: "#0B0F19", color: "#FBBF24", fontFamily: "monospace", flexDirection: "column", gap: "12px" }}>
        <div>⏳ Waiting for canvas services...</div>
        <div style={{ fontSize: "12px", color: "#64748B" }}>If this persists, check the console for errors.</div>
      </div>
    );
  }

  const breadcrumbData = mode === "import" ? contextRef.current || currentDocument : effectiveDocumentState;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 320px", gridTemplateRows: "auto 1fr", width: "100%", height: "100%", overflow: "hidden", background: "#0B0F19", position: "relative" }} data-render-tick={changeTrigger}>
      {showDbDump && (
        <div style={{ position: "absolute", top: "60px", left: "60px", right: "340px", bottom: "20px", zIndex: 99999, backgroundColor: "#030712", border: "2px solid #1E293B", borderRadius: "12px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.75)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "8px 16px", backgroundColor: "#0F172A", borderBottom: "1px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#38BDF8", fontWeight: "bold", fontFamily: "monospace", fontSize: "11px" }}>[LIVE SERVER DB FIREWALL INSPECTOR]</span>
            <button onClick={() => setShowDbDump(false)} style={{ backgroundColor: "#EF4444", border: "none", color: "#FFFFFF", padding: "4px 10px", borderRadius: "4px", cursor: "pointer", fontFamily: "monospace", fontSize: "11px", fontWeight: "bold" }}>CLOSE TERMINAL</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}><DatabaseContentDump /></div>
        </div>
      )}

      <div style={{ gridColumn: "1 / span 3" }}>
        <FloorPlanToolbar api={apiInstance} toolManager={sharedToolManager} documentManager={sharedDocumentManager} viewport={sharedViewport} isReadOnly={isReadOnly} />
      </div>

      <FloorPlanSidebar toolManager={sharedToolManager} toolContext={sharedToolContext} isReadOnly={isReadOnly} />

      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", overflow: "hidden", background: "#090D16" }}>
        <div style={{ position: "relative", zIndex: 10, width: "100%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#090D16" }}>
          <div style={{ flexGrow: 1 }}>
            {/* 
              We've removed the `dbMetrics` prop so the widget reads 
              directly from Redux and correctly computes the counts.
            */}
            <FloorPlanBreadcrumbWithDatabaseIndicatorWidget activeDocumentState={breadcrumbData} />
          </div>
          <button onClick={() => setShowDbDump(!showDbDump)} style={{ marginRight: "16px", backgroundColor: "rgba(5, 255, 196, 0.08)", border: "1px solid #05FFC4", color: "#05FFC4", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontFamily: "monospace", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", transition: "all 0.15s" }}>
            {showDbDump ? "Hide DB Payload" : "Expose DB Payload"}
          </button>
        </div>

        {isReadOnly && (
          <div style={{ width: "100%", padding: "8px 16px", background: "rgba(255, 184, 0, 0.12)", borderBottom: "1px solid rgba(255, 184, 0, 0.4)", color: "#FFB800", fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <span>🔒</span>
            <span>Read-only — this document is locked by <span style={{ color: "#FFD966" }}>{docLockedBy || "another user"}</span>. Pan and zoom are available; edits are disabled.</span>
          </div>
        )}

        <div style={{ flexGrow: 1, width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", background: "#000000" }}>
          <FloorPlanCanvas
            plan={effectiveDocumentState || currentDocument}
            activeTool={activeTool}
            isReadOnly={isReadOnly}
            toolManager={sharedToolManager}
            toolContext={sharedToolContext}
          />
          <CalibrationDialog isOpen={false} onClose={() => {}} onConfirm={(meters) => {
            dispatch(setCalibrationDistance({ knownDistance: meters, unit: "m" }));
            window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
          }} />
        </div>
      </div>

      <div style={{ borderLeft: "1px solid #1E293B", overflow: "auto", background: "#0F1424" }}>
        <Inspector />
      </div>

      <FloatingDrawGroup toolManager={sharedToolManager} isReadOnly={isReadOnly} />
    </div>
  );
};

export default FloorPlanDesigner;