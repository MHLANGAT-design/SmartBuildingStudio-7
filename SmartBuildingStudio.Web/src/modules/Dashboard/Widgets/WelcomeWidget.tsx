import { useMemo, useState, useEffect } from "react";
import { useAppSelector } from "@/Application/ConfigureStore";
import { UseDashboard } from "@/modules/Dashboard/Hooks/UseDashboard";

export default function WelcomeWidget() {
  const { documents: fallbackDocs } = UseDashboard();
  const [dbTree, setDbTree] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);

  // Search query reads from dashboard.activeFilters.projectQuery —
  // the field the header's search input writes to via
  // UseDashboard.searchProjects → setProjectSearchQuery.
  const searchQuery = useAppSelector(
    (state: any) => state.dashboard?.activeFilters?.projectQuery || ""
  );

  useEffect(() => {
    fetch("/api/v1/project-explorer/tree")
      .then((res) => {
        if (!res.ok) throw new Error("API port unreachable");
        return res.json();
      })
      .then((data) => {
        setDbTree(Array.isArray(data) ? data : []);
        setIsSyncing(false);
      })
      .catch((err) => {
        console.error("[Welcome Metrics Fetch Fail]:", err);
        setIsSyncing(false);
      });
  }, []);

  const metrics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const projects = dbTree.filter((p: any) => {
      const nameStr = p.Name || p.name || "";
      return !query || nameStr.toLowerCase().includes(query);
    });

    let buildingCount = 0;
    let floorCount = 0;
    let documentCount = 0;

    projects.forEach((p: any) => {
      const buildings = p.Buildings || p.buildings || [];
      buildingCount += buildings.length;

      buildings.forEach((bldg: any) => {
        const floors = bldg.Floors || bldg.floors || [];
        floorCount += floors.length;

        floors.forEach((fl: any) => {
          const docs = fl.Documents || fl.documents || [];
          documentCount += docs.length;
        });
      });
    });

    const activeProjects = projects.length;
    const activeScope = buildingCount + floorCount;
    const activeEngScope = documentCount;
    const totalCount = activeProjects + buildingCount + floorCount + activeEngScope;

    return { activeProjects, activeScope, activeEngScope, totalCount };
  }, [dbTree, searchQuery]);

  const stat = (
    label: string,
    value: string,
    color: string
  ) => (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 6,
        padding: "4px 10px",
        background: "rgba(22, 31, 49, 0.55)",
        border: "1px solid #1E293B",
        borderRadius: 6,
      }}
    >
      <span
        style={{
          fontSize: 9,
          color: "#64748B",
          textTransform: "uppercase",
          fontFamily: "monospace",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: "bold",
          color,
          fontFamily: "monospace",
        }}
      >
        {value}
      </span>
    </div>
  );

  const loading = isSyncing ? ".." : null;

  return (
    <div
      style={{
        position: "relative",
        background: "linear-gradient(90deg, #111827, #0F1424)",
        border: "1px solid #1E293B",
        borderRadius: 10,
        padding: "12px 16px 12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: "linear-gradient(180deg, #00D2FF, #05FFC4)",
        }}
      />

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: "bold",
            color: "#FFFFFF",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Welcome back, Lead Systems Engineer
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#64748B",
            marginTop: 2,
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Manage subnets, calibrate blueprints, run DALI loop audits.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "nowrap",
          flexShrink: 0,
        }}
      >
        {stat(
          "Projects",
          loading ?? String(metrics.activeProjects).padStart(2, "0"),
          "#FFFFFF"
        )}
        {stat(
          "Scope",
          loading ?? String(metrics.activeScope).padStart(2, "0"),
          "#00D2FF"
        )}
        {stat(
          "Eng",
          loading ??
            String(metrics.activeEngScope || fallbackDocs.length).padStart(
              2,
              "0"
            ),
          "#05FFC4"
        )}
        {stat(
          "Total",
          loading ?? String(metrics.totalCount).padStart(2, "0"),
          "#A855F7"
        )}
      </div>
    </div>
  );
}