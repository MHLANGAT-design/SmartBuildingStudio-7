import { useState, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/Application/ConfigureStore";

export default function TasksWidget() {
  const dispatch = useAppDispatch();

  const explorerNodes = useAppSelector((state: any) =>
    state.ProjectExplorer?.nodes || state.projectExplorer?.nodes || []
  );

  // Search query reads from dashboard.activeFilters.projectQuery —
  // the field the header's search input writes to via
  // UseDashboard.searchProjects → setProjectSearchQuery.
  const searchQuery = useAppSelector(
    (state: any) => state.dashboard?.activeFilters?.projectQuery || ""
  );

  const [locallyClearedTasks, setLocallyClearedTasks] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState(false);

  const liveTasksList = useMemo(() => {
    const list: any[] = [];
    const query = searchQuery.trim().toLowerCase();

    explorerNodes.forEach((node: any) => {
      const errorCount = node.validationErrorCount || node.ValidationErrorCount || 0;
      const nodeName = node.name || node.Name || "Unnamed Structure";

      if (node.type === "Project" || node.type === "Building" || node.type === "Floor") {
        const taskId = `task-err-${node.id}`;
        const isCurrentlyDone = locallyClearedTasks[taskId] ?? (errorCount === 0);
        const taskLabel = `Resolve rule audit validation faults on ${node.type} node branch: "${nodeName}"`;

        if (query && !taskLabel.toLowerCase().includes(query)) return;

        list.push({
          id: taskId,
          nodeId: node.id,
          label: taskLabel,
          done: isCurrentlyDone,
        });
      }
    });

    if (list.length === 0) {
      list.push(
        { id: "seed-t1", label: "Calibrate distance coordinate scaling factors for imported groundbreaking blueprint sheets.", done: true },
        { id: "seed-t2", label: "Configure emergency fallback illumination profiles for transit path zone subnets.", done: false }
      );
    }

    return list;
  }, [explorerNodes, searchQuery, locallyClearedTasks]);

  const pendingCount = useMemo(() => {
    return liveTasksList.filter((t) => !t.done).length;
  }, [liveTasksList]);

  const handleToggleTask = (taskId: string, nodeId?: string) => {
    setLocallyClearedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));

    if (nodeId) {
      dispatch({
        type: "projectExplorer/clearNodeErrorsSimulation",
        payload: nodeId,
      });
    }
  };

  return (
    <div
      style={{
        background: "rgba(22, 30, 49, 0.4)",
        border: "1px solid #1E293B",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="tasks-widget-body"
        style={{
          padding: "20px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          textAlign: "left",
          fontFamily: "inherit",
          color: "inherit",
          borderBottom: expanded ? "1px solid #1E293B" : "none",
          transition: "border-color 0.15s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg
            style={{ width: "16px", height: "16px", color: "#00D2FF" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="m9 14 2 2 4-4" />
          </svg>
          <div>
            <h3
              style={{
                fontSize: "10px",
                fontFamily: "monospace",
                color: "#64748B",
                textTransform: "uppercase",
                margin: 0,
                letterSpacing: "0.1em",
              }}
            >
              Task Tracker
            </h3>
            <h2
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#FFF",
                margin: "2px 0 0 0",
                fontFamily: "sans-serif",
              }}
            >
              Engineering Assignments
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontSize: "9px",
              fontFamily: "monospace",
              color: pendingCount > 0 ? "#00D2FF" : "#05FFC4",
              backgroundColor: "#090D16",
              border: "1px solid #1E293B",
              padding: "2px 8px",
              borderRadius: "6px",
            }}
          >
            STREAMS // {String(pendingCount).padStart(2, "0")}
          </span>

          <span
            style={{
              display: "inline-flex",
              color: "#64748B",
              transition: "transform 0.2s ease",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
            aria-hidden="true"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </div>
      </button>

      <div
        id="tasks-widget-body"
        style={{
          display: "grid",
          gridTemplateRows: expanded ? "1fr" : "0fr",
          transition: "grid-template-rows 0.2s ease",
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <div style={{ padding: "0 20px 16px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                paddingTop: "16px",
              }}
            >
              {liveTasksList.map((task) => {
                const borderLeftColor = task.done ? "#475569" : "#00D2FF";
                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id, task.nodeId)}
                    style={{
                      padding: "12px",
                      background: "#090D16",
                      border: "1px solid #1E293B",
                      borderLeft: `3px solid ${borderLeftColor}`,
                      borderRadius: "0 12px 12px 0",
                      display: "flex",
                      alignItems: "start",
                      gap: "12px",
                      opacity: task.done ? 0.5 : 1,
                      position: "relative",
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    className="hover:bg-slate-900/40"
                    title={`Click to mark this engineering assignment as ${task.done ? "PENDING" : "COMPLETE"}`}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        height: "16px",
                        marginTop: "2px",
                        flexShrink: 0,
                      }}
                    >
                      {task.done ? (
                        <svg
                          style={{ width: "16px", height: "16px", color: "#05FFC4" }}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            border: "2px solid #475569",
                            borderRadius: "3px",
                          }}
                        />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: "12px",
                          lineHeight: "1.5",
                          fontFamily: "sans-serif",
                          display: "block",
                          color: task.done ? "#64748B" : "#E2E8F0",
                          textDecoration: task.done ? "line-through" : "none",
                        }}
                      >
                        {task.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: "12px",
                fontSize: "9px",
                color: "#475569",
                fontFamily: "monospace",
                textAlign: "right",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Thread Registry Processing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}