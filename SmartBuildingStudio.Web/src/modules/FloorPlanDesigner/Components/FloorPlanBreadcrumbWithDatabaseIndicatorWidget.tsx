// src/modules/FloorPlanDesigner/Components/FloorPlanBreadcrumbWithDatabaseIndicatorWidget.tsx
//
// Breadcrumb + database indicator.
//
// LEVEL 1 LOCK ENFORCEMENT:
//   The document response (GET /documents/{id}) now returns
//   projectName / buildingName / floorName alongside the document
//   name and lock state. The breadcrumb reads these first, falling
//   back to the legacy activeProjectName / activeBuildingName /
//   activeFloorName field names (which older responses may use).
//
//   The same response also carries isLocked / lockedByUsername;
//   FloorPlanDesigner uses those to set isReadOnly and renders the
//   read-only banner. The breadcrumb itself doesn't touch lock state.

import React, { useMemo } from "react";
import { useAppSelector } from "@/Application/ConfigureStore";

interface WidgetProps {
  activeDocumentState?: any;
  dbMetrics?: { 
    wCount: number; 
    dCount: number; 
    winCount: number; 
    rCount: number; 
    isFetched: boolean; 
  };
}

export const FloorPlanBreadcrumbWithDatabaseIndicatorWidget = ({ activeDocumentState, dbMetrics }: WidgetProps) => {
  const explorerNodes = useAppSelector((state: any) => state?.projectExplorer?.nodes || []);
  const selectedNodeId = useAppSelector((state: any) => state?.projectExplorer?.selectedNodeId);
  
  const floorPlanState = useAppSelector((state: any) => state?.floorPlan || {});
  const isLoading = useAppSelector((state: any) => state?.floorPlan?.loading || state?.floorPlan?.isLoading || false);
  const fetchError = useAppSelector((state: any) => state?.floorPlan?.error || null);

  const metrics = useMemo(() => {
    if (dbMetrics) return dbMetrics;
    const sourceDoc = activeDocumentState || floorPlanState?.document || floorPlanState || {};
    
    const resolveLength = (field: any) => {
      if (!field) return 0;
      if (typeof field.size === "number") return field.size;
      if (typeof field.length === "number") return field.length;
      if (typeof field.values === "function") return Array.from(field.values()).length;
      return Object.keys(field).length;
    };

    const wallsLength = resolveLength(sourceDoc.walls);
    const doorsLength = resolveLength(sourceDoc.doors);
    const windowsLength = resolveLength(sourceDoc.windows);
    const roomsLength = resolveLength(sourceDoc.rooms);
    const hasData = wallsLength > 0 || doorsLength > 0 || windowsLength > 0 || roomsLength > 0;

    return {
      wCount: wallsLength,
      dCount: doorsLength,
      winCount: windowsLength,
      rCount: roomsLength,
      isFetched: hasData && !isLoading
    };
  }, [dbMetrics, activeDocumentState, floorPlanState, isLoading]);

  const breadcrumbLabels = useMemo(() => {
    const globalContext = (window as any).__floorPlanActiveDocumentInstance;
    const targetId = selectedNodeId || activeDocumentState?.id || globalContext?.id;
    const currentNode = explorerNodes.find((n: any) => n && String(n.id) === String(targetId));
    
    // Read the new backend fields first (projectName / buildingName /
    // floorName), then fall back to legacy names (activeProjectName /
    // activeBuildingName / activeFloorName), then to the global context
    // (which FloorPlanDesigner sets from the same source), then to
    // hardcoded defaults.
    return {
      docName:
        currentNode?.name ||
        activeDocumentState?.name ||
        activeDocumentState?.activeDocumentName ||
        globalContext?.activeDocumentName ||
        "Blueprint Layout",
      floorName:
        activeDocumentState?.floorName ||
        activeDocumentState?.activeFloorName ||
        globalContext?.activeFloorName ||
        "Ground Level",
      buildingName:
        activeDocumentState?.buildingName ||
        activeDocumentState?.activeBuildingName ||
        globalContext?.activeBuildingName ||
        "Main Building",
      projectName:
        activeDocumentState?.projectName ||
        activeDocumentState?.activeProjectName ||
        globalContext?.activeProjectName ||
        "Studio Project",
    };
  }, [selectedNodeId, activeDocumentState, explorerNodes]);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* 🚨 ERROR INDICATOR ALERT BAR */}
      {fetchError && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          background: "rgba(239, 68, 68, 0.1)",
          borderBottom: "1px solid rgba(239, 68, 68, 0.25)",
          color: "#EF4444",
          fontFamily: "monospace",
          fontSize: "10px",
          fontWeight: "bold"
        }}>
          <span>⚠️ FETCH FAILURE: {typeof fetchError === "string" ? fetchError : fetchError.message || "Failed to retrieve canvas network profile."}</span>
        </div>
      )}

      {/* CORE BREADCRUMB WIDGET */}
      <div style={{
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        padding: "12px 16px", 
        minHeight: "44px", 
        height: "auto", 
        boxSizing: "border-box",
        background: "#0F1424", 
        borderBottom: "1px solid #1E293B", 
        fontFamily: "monospace", 
        fontSize: "11px", 
        lineHeight: "1.4", 
        color: "#94A3B8", 
        userSelect: "none"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "auto", lineHeight: "1.4" }}>
          <span style={{ color: "#38BDF8", display: "inline-block", verticalAlign: "middle" }}>📂 {breadcrumbLabels.projectName.toUpperCase()}</span>
          <span style={{ display: "inline-block", verticalAlign: "middle" }}>/</span>
          <span style={{ display: "inline-block", verticalAlign: "middle" }}>🏢 {breadcrumbLabels.buildingName}</span>
          <span style={{ display: "inline-block", verticalAlign: "middle" }}>/</span>
          <span style={{ display: "inline-block", verticalAlign: "middle" }}>🥞 {breadcrumbLabels.floorName}</span>
          <span style={{ display: "inline-block", verticalAlign: "middle" }}>/</span>
          <span style={{ color: "#F1F5F9", fontWeight: "bold", display: "inline-block", verticalAlign: "middle" }}>📄 {breadcrumbLabels.docName}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", height: "auto", lineHeight: "1.4" }}>
          {/* ⏳ DYNAMIC STATE STATUS BADGE */}
          <div style={{
            display: "flex", 
            alignItems: "center", 
            gap: "6px", 
            padding: "4px 8px", 
            borderRadius: "4px",
            background: isLoading 
              ? "rgba(56, 189, 248, 0.08)" 
              : metrics.isFetched ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
            border: isLoading
              ? "1px solid rgba(56, 189, 248, 0.25)"
              : metrics.isFetched ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(245, 158, 11, 0.25)",
            color: isLoading ? "#38BDF8" : metrics.isFetched ? "#10B981" : "#F59E0B", 
            fontWeight: "bold", 
            fontSize: "10px", 
            lineHeight: "1"
          }}>
            <span style={{ 
              width: "6px", 
              height: "6px", 
              borderRadius: "50%", 
              background: isLoading ? "#38BDF8" : metrics.isFetched ? "#10B981" : "#F59E0B", 
              display: "inline-block", 
              verticalAlign: "middle" 
            }} />
            <span style={{ display: "inline-block", verticalAlign: "middle" }}>
              {isLoading ? "⏳ LOADING..." : metrics.isFetched ? "DB HYDRATED" : "MEM STREAM"}
            </span>
          </div>
          
          <div style={{ color: "#64748B", fontSize: "10px", lineHeight: "1.4" }}>
            <span>W: <b style={{ color: "#E2E8F0" }}>{metrics.wCount}</b></span>
            <span style={{ marginLeft: "6px" }}>D: <b style={{ color: "#E2E8F0" }}>{metrics.dCount}</b></span>
            <span style={{ marginLeft: "6px" }}>WIN: <b style={{ color: "#E2E8F0" }}>{metrics.winCount}</b></span>
            <span style={{ marginLeft: "6px" }}>RM: <b style={{ color: "#E2E8F0" }}>{metrics.rCount}</b></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanBreadcrumbWithDatabaseIndicatorWidget;