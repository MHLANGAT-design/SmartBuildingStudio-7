// src/modules/FloorPlanDesigner/Components/FloorPlanBreadcrumbWithDatabaseIndicatorWidget.tsx

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

export const FloorPlanBreadcrumbWithDatabaseIndicatorWidget = ({
  activeDocumentState,
  dbMetrics,
}: WidgetProps) => {
  const explorerNodes = useAppSelector(
    (state: any) => state?.projectExplorer?.nodes || []
  );
  const selectedNodeId = useAppSelector(
    (state: any) => state?.projectExplorer?.selectedNodeId
  );

  const floorPlanState = useAppSelector((state: any) => state?.floorPlan || {});
  const isLoading = useAppSelector(
    (state: any) =>
      state?.floorPlan?.loading || state?.floorPlan?.isLoading || false
  );
  const fetchError = useAppSelector(
    (state: any) => state?.floorPlan?.error || null
  );

  const metrics = useMemo(() => {
    // Only trust the prop if it actually carries the full metric shape.
    // FloorPlanDesigner currently passes a stub that only has isFetched,
    // which previously caused every count to render as undefined (blank).
    const hasCounts =
      dbMetrics &&
      typeof dbMetrics.wCount === "number" &&
      typeof dbMetrics.dCount === "number" &&
      typeof dbMetrics.winCount === "number" &&
      typeof dbMetrics.rCount === "number";

    if (hasCounts) return dbMetrics;

    const doc = floorPlanState?.document || {};
    const elements: any[] = Array.isArray(doc.elements) ? doc.elements : [];

    let walls = 0,
      doors = 0,
      windows = 0,
      rooms = 0;

    for (const el of elements) {
      const type = String(el.type || "").toLowerCase();
      const layer = String(el.layer || el.originalLayer || "").toLowerCase();

      if (type === "room" || el.isRoom === true || layer === "rooms") {
        rooms++;
      } else if (
        type.includes("door") ||
        layer.includes("door") ||
        layer === "dr"
      ) {
        doors++;
      } else if (
        type.includes("window") ||
        layer.includes("window") ||
        layer.includes("glaz")
      ) {
        windows++;
      } else if (
        type.includes("wall") ||
        type === "polyline" ||
        layer.includes("wall") ||
        el.thickness !== undefined
      ) {
        walls++;
      }
    }

    // Prefer the semantic arrays when populated (matches Inspector);
    // fall back to the element scan when they aren't (matches the
    // ComponentExplorer before the mapper splits the flat array).
    const w =
      Array.isArray(doc.walls) && doc.walls.length > 0
        ? doc.walls.length
        : walls;
    const d =
      Array.isArray(doc.doors) && doc.doors.length > 0
        ? doc.doors.length
        : doors;
    const win =
      Array.isArray(doc.windows) && doc.windows.length > 0
        ? doc.windows.length
        : windows;
    const rm =
      Array.isArray(doc.rooms) && doc.rooms.length > 0
        ? doc.rooms.length
        : rooms;

    const hasData = w > 0 || d > 0 || win > 0 || rm > 0;

    return {
      wCount: w,
      dCount: d,
      winCount: win,
      rCount: rm,
      isFetched: hasData && !isLoading,
    };
  }, [dbMetrics, floorPlanState, isLoading]);

  const breadcrumbLabels = useMemo(() => {
    const globalContext = (window as any).__floorPlanActiveDocumentInstance;
    const targetId =
      selectedNodeId || activeDocumentState?.id || globalContext?.id;
    const currentNode = explorerNodes.find(
      (n: any) => n && String(n.id) === String(targetId)
    );

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
      {fetchError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: "rgba(239, 68, 68, 0.1)",
            borderBottom: "1px solid rgba(239, 68, 68, 0.25)",
            color: "#EF4444",
            fontFamily: "monospace",
            fontSize: "10px",
            fontWeight: "bold",
          }}
        >
          <span>
            ⚠️ FETCH FAILURE:{" "}
            {typeof fetchError === "string"
              ? fetchError
              : fetchError.message ||
                "Failed to retrieve canvas network profile."}
          </span>
        </div>
      )}

      <div
        style={{
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
          userSelect: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            height: "auto",
            lineHeight: "1.4",
          }}
        >
          <span style={{ color: "#38BDF8", display: "inline-block" }}>
            📂 {breadcrumbLabels.projectName.toUpperCase()}
          </span>
          <span style={{ display: "inline-block" }}>/</span>
          <span style={{ display: "inline-block" }}>
            🏢 {breadcrumbLabels.buildingName}
          </span>
          <span style={{ display: "inline-block" }}>/</span>
          <span style={{ display: "inline-block" }}>
            🥞 {breadcrumbLabels.floorName}
          </span>
          <span style={{ display: "inline-block" }}>/</span>
          <span
            style={{
              color: "#F1F5F9",
              fontWeight: "bold",
              display: "inline-block",
            }}
          >
            📄 {breadcrumbLabels.docName}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            height: "auto",
            lineHeight: "1.4",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 8px",
              borderRadius: "4px",
              background: isLoading
                ? "rgba(56, 189, 248, 0.08)"
                : metrics.isFetched
                ? "rgba(16, 185, 129, 0.08)"
                : "rgba(245, 158, 11, 0.08)",
              border: isLoading
                ? "1px solid rgba(56, 189, 248, 0.25)"
                : metrics.isFetched
                ? "1px solid rgba(16, 185, 129, 0.25)"
                : "1px solid rgba(245, 158, 11, 0.25)",
              color: isLoading
                ? "#38BDF8"
                : metrics.isFetched
                ? "#10B981"
                : "#F59E0B",
              fontWeight: "bold",
              fontSize: "10px",
              lineHeight: "1",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: isLoading
                  ? "#38BDF8"
                  : metrics.isFetched
                  ? "#10B981"
                  : "#F59E0B",
                display: "inline-block",
              }}
            />
            <span style={{ display: "inline-block" }}>
              {isLoading
                ? "⏳ LOADING..."
                : metrics.isFetched
                ? "DB HYDRATED"
                : "MEM STREAM"}
            </span>
          </div>

          <div style={{ color: "#64748B", fontSize: "10px", lineHeight: "1.4" }}>
            <span>
              W: <b style={{ color: "#E2E8F0" }}>{metrics.wCount}</b>
            </span>
            <span style={{ marginLeft: "6px" }}>
              D: <b style={{ color: "#E2E8F0" }}>{metrics.dCount}</b>
            </span>
            <span style={{ marginLeft: "6px" }}>
              WIN: <b style={{ color: "#E2E8F0" }}>{metrics.winCount}</b>
            </span>
            <span style={{ marginLeft: "6px" }}>
              RM: <b style={{ color: "#E2E8F0" }}>{metrics.rCount}</b>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanBreadcrumbWithDatabaseIndicatorWidget;