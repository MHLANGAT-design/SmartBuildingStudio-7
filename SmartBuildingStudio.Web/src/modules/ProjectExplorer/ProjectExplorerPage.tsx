// ProjectExplorerPage.tsx
// COMPLETE FILE - Replace everything

import React, { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from "@/Application/ConfigureStore";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchProjectExplorerTree } from "@/modules/ProjectExplorer/Store/ProjectExplorerThunks";
import {
  selectAllProjects,
  selectExplorerLoading,
  selectExplorerError,
  selectSelectedNode,
  selectSelectedNodeId
} from "@/modules/ProjectExplorer/Store/ProjectExplorerSelectors";
import DashboardHeader from "@/modules/Dashboard/Layout/DashboardHeader";
import DashboardFooter from "@/modules/Dashboard/Layout/DashboardFooter";

// ABSOLUTE WIDGET COMPONENT ROUTING LINKS
import ExplorerToolbarWidget from "@/modules/ProjectExplorer/Widgets/ExplorerToolbarWidget";
import ExplorerSidebarWidget from "@/modules/ProjectExplorer/Widgets/ExplorerSidebarWidget";
import ExplorerLedgerWidget from "@/modules/ProjectExplorer/Widgets/ExplorerLedgerWidget";
import ExplorerDialogsWidget from "@/modules/ProjectExplorer/Widgets/ExplorerDialogsWidget";

// Document action tiles — replaces the DesignAccessModal flow.
import { DocumentActionsPanel } from "@/modules/ProjectExplorer/Sidebar/DocumentActionsPanel";

// 🚀 FIXED SYSTEM IMPORT CONTRACT:
// Refactored from a named bracket import to a clean default import statement.
// This resolves the Vite bundle resolution named export crash instantly.
import FloorPlanDesigner from '@/modules/FloorPlanDesigner/FloorPlanDesigner';

export default function ProjectExplorerPage() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const projects = useAppSelector(selectAllProjects);
  const loading = useAppSelector(selectExplorerLoading);
  const error = useAppSelector(selectExplorerError);
  const selectedNode = useAppSelector(selectSelectedNode);
  const selectedNodeId = useAppSelector(selectSelectedNodeId);

  const reduxWorkspaceViewMode = useAppSelector((state: any) => {
    const slice = state?.floorPlan || state?.FloorPlan || {};
    return slice.workspaceViewMode || "explorer";
  });

  // Dynamic path parser checks query parameters and splat paths safely
  const urlDocumentId = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchParamId = searchParams.get("documentId");
    if (searchParamId) return searchParamId;
    const urlSegments = location.pathname.split('/');
    const targetGuidSegment = urlSegments[urlSegments.length - 1];
    const guidRegexPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (guidRegexPattern.test(targetGuidSegment)) {
      return targetGuidSegment;
    }
    return null;
  }, [location.search, location.pathname]);

  const isDesignerActiveRoute = reduxWorkspaceViewMode === "designer" || !!urlDocumentId;

  useEffect(() => {
    dispatch(fetchProjectExplorerTree() as any);
  }, [dispatch]);

  // Writes projects array directly to window context so controllers map parent fields instantly
  useEffect(() => {
    if (projects && projects.length > 0) {
      (window as any).__lastResolvedExplorerTreePayload = projects;
    }
  }, [projects]);

  useEffect(() => {
    if (urlDocumentId && reduxWorkspaceViewMode !== "designer") {
      dispatch({ type: "floorPlan/setWorkspaceViewMode", payload: "designer" });
      dispatch({ type: "FloorPlan/setWorkspaceViewMode", payload: "designer" });
      dispatch({ type: "floorPlan/syncDocumentState" });
    }
  }, [urlDocumentId, reduxWorkspaceViewMode, dispatch]);

  const handleExitToExplorer = () => {
    dispatch({ type: "floorPlan/setWorkspaceViewMode", payload: "explorer" });
    dispatch({ type: "FloorPlan/setWorkspaceViewMode", payload: "explorer" });
    navigate("/explorer", { replace: true });
    window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
  };

  return (
    <div
      style={{
        background: "#0B0F19",
        height: "100%",
        minHeight: 0,
        color: "#E2E8F0",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* GRADIENT TOP LASER RIBBON MATRIX */}
      <div
        style={{
          height: "3px",
          background: "linear-gradient(90deg, #00D2FF, #05FFC4, #FFB800)",
          boxShadow: "0 2px 20px rgba(5,255,196,0.6)",
          position: "relative",
          zIndex: 30,
          flexShrink: 0,
        }}
      />
      <div style={{ flexShrink: 0 }}>
        <DashboardHeader />
      </div>

      {/* BACKGROUND GRAPH DECORATOR */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          left: "-10%",
          width: "60%",
          height: "60%",
          borderRadius: "50%",
          background: "rgba(0, 210, 255, 0.03)",
          filter: "blur(120px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <main
        style={{
          flex: 1,
          minHeight: 0,
          maxWidth: "1600px",
          width: "100%",
          margin: "0 auto",
          padding: "16px 24px",
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* CONDITIONAL WORKSPACE MATRIX LAYOUT SWITCH */}
        {isDesignerActiveRoute ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, minHeight: 0 }}>
            <div style={{ display: "flex", justifyContent: "flex-start", width: "100%", flexShrink: 0 }}>
              <button
                onClick={handleExitToExplorer}
                style={{ padding: "8px 16px", background: "#1E293B", border: "1px solid #334155", borderRadius: "8px", color: "#94A3B8", cursor: "pointer", fontFamily: "monospace", fontSize: "11px", fontWeight: "bold" }}
              >
                ← EXIT DESIGNER MODE
              </button>
            </div>
            {/* Core rendering port container frames FloorPlanDesigner to fill screen width natively */}
            <div style={{ width: "100%", background: "#060911", border: "1px solid #1E293B", borderRadius: "12px", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
              <FloorPlanDesigner />
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, minHeight: 0 }}>
            <div style={{ flexShrink: 0 }}>
              <ExplorerToolbarWidget selectedNode={selectedNode} selectedNodeId={selectedNodeId} />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "20px",
                width: "100%",
                flex: 1,
                minHeight: 0,
                alignItems: "stretch",
              }}
            >
              {/* Tree column — 40% width, scrolls independently, wide enough
                  to show project → building → floor hierarchy without truncation. */}
              <div
                style={{
                  width: "40%",
                  minWidth: 320,
                  height: "100%",
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <ExplorerSidebarWidget selectedNodeId={selectedNodeId} loading={loading} />
              </div>

              {/* Main content column — 60% width, scrolls independently. */}
              <div
                style={{
                  width: "60%",
                  height: "100%",
                  minHeight: 0,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {error && (
                  <div style={{ color: "#F43F5E", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", padding: "12px", borderRadius: "8px", fontFamily: "monospace", fontSize: "12px", flexShrink: 0 }}>
                    ⚠️Platform Alert: {error}
                  </div>
                )}

                <DocumentActionsPanel />

                <ExplorerLedgerWidget projects={projects} loading={loading} selectedNodeId={selectedNodeId} />
              </div>
            </div>
          </div>
        )}
      </main>

      <ExplorerDialogsWidget selectedNode={selectedNode} />
      <div style={{ flexShrink: 0 }}>
        <DashboardFooter />
      </div>
    </div>
  );
}