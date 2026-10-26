// src/modules/Dashboard/Widgets/RecentDocumentsWidget.tsx
//
// Recent documents list.
//
// Two independent actions:
//   • Click anywhere on the row (or the document name) → navigate to
//     the FloorPlanDesigner with that document id as a URL param.
//   • Click the lock button on the right → calls the real backend lock
//     endpoint (POST /api/v1/project-explorer/documents/{id}/lock or
//     /unlock), then refetches the tree so the real lock state from
//     the DB is what's displayed.
//
// Lock state is read from doc.isLocked / doc.lockedByUsername (returned
// by the tree endpoint). No local useState mirror — the backend is the
// source of truth.
//
// Layout note: the header has flexShrink: 0 and the scrollable list has
// minHeight: 0. Without both, flexbox compresses the header when the
// list has many items, pushing the first row's controls up into the
// header's visual region and blocking clicks.

import { useMemo, useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/Application/ConfigureStore";
import { useNavigate } from "react-router-dom";

export default function RecentDocumentsWidget() {
  const [dbTree, setDbTree] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [pendingLocks, setPendingLocks] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const searchQuery = useAppSelector(
    (state: any) => state.dashboard?.activeFilters?.projectQuery || ""
  );

  const loadTree = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/project-explorer/tree");
      if (!res.ok) {
        setDbTree([]);
        return;
      }
      const data = await res.json();
      setDbTree(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[RecentDocumentsWidget] tree fetch failed:", err);
      setDbTree([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadTree();
      if (!cancelled) setIsSyncing(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadTree]);

  const liveDbDocuments = useMemo(() => {
    const flattenedList: any[] = [];
    const query = searchQuery.trim().toLowerCase();

    dbTree.forEach((proj: any) => {
      const buildings = proj.buildings || proj.Buildings || [];
      buildings.forEach((bldg: any) => {
        const floors = bldg.floors || bldg.Floors || [];
        floors.forEach((floor: any) => {
          const docs = floor.documents || floor.Documents || [];
          docs.forEach((doc: any) => {
            const docName = doc.name || doc.Name || "";
            if (query && !docName.toLowerCase().includes(query)) return;

            // Backend returns camelCase (Program.cs sets
            // JsonNamingPolicy.CamelCase globally). Read camelCase
            // first, PascalCase as fallback for safety.
            const isLocked =
              typeof doc.isLocked === "boolean"
                ? doc.isLocked
                : typeof doc.IsLocked === "boolean"
                ? doc.IsLocked
                : false;

            const lockedByUsername =
              doc.lockedByUsername ?? doc.LockedByUsername ?? null;

            flattenedList.push({
              id: doc.id || doc.Id,
              title: docName,
              floorName: floor.name || floor.Name || "System Level",
              moduleOwner:
                (doc.documentType ?? doc.DocumentType) === 0
                  ? "EE"
                  : "ELECTRICAL",
              isLocked,
              lockedByUsername,
            });
          });
        });
      });
    });

    if (flattenedList.length === 0 && !isSyncing && dbTree.length > 0) {
      return [
        {
          id: "seed-doc-01",
          title: "Architectural Plan",
          floorName: "Ground Floor",
          moduleOwner: "EE",
          isLocked: false,
          lockedByUsername: null,
        },
        {
          id: "seed-doc-02",
          title: "DALI Loop Layout Layout",
          floorName: "Level 1",
          moduleOwner: "ELECTRICAL",
          isLocked: false,
          lockedByUsername: null,
        },
      ];
    }

    return flattenedList;
  }, [dbTree, searchQuery, isSyncing]);

  const handleOpenDocument = useCallback(
    (docId: string) => {
      if (docId.startsWith("seed-")) return;
      navigate(`/designer?mode=floorplans&documentId=${docId}`);
    },
    [navigate]
  );

  const handleToggleLock = useCallback(
    async (docId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      const doc = liveDbDocuments.find((d) => d.id === docId);
      if (!doc) return;

      const action = doc.isLocked ? "unlock" : "lock";
      setPendingLocks((prev) => ({ ...prev, [docId]: true }));

      try {
        const res = await fetch(
          `/api/v1/project-explorer/documents/${docId}/${action}`,
          { method: "POST" }
        );
        if (!res.ok) {
          console.warn(
            `[Lock toggle] ${action} failed with status ${res.status}`
          );
        }
        await loadTree();
      } catch (err) {
        console.error("[Lock toggle] network error:", err);
      } finally {
        setPendingLocks((prev) => {
          const next = { ...prev };
          delete next[docId];
          return next;
        });
      }
    },
    [liveDbDocuments, loadTree]
  );

  return (
    <div style={{ background: "rgba(22, 30, 49, 0.4)", border: "1px solid #1E293B", borderRadius: "16px", padding: "20px", height: "340px", display: "flex", flexDirection: "column", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: "96px", height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,210,255,0.4))" }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: "1px", height: "96px", background: "linear-gradient(180deg, rgba(0,210,255,0.4), transparent)" }} />

      <div style={{ marginBottom: "16px", flexShrink: 0, display: "flex", alignItems: "start", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid #1E293B" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg style={{ width: "14px", height: "14px", color: "#00D2FF" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
            <h3 style={{ fontSize: "10px", fontFamily: "monospace", color: "#64748B", textTransform: "uppercase", margin: 0, letterSpacing: "0.1em" }}>Document Register</h3>
          </div>
          <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#FFF", margin: "4px 0 0 0" }}>Recent Design Layouts</h2>
        </div>
        <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#00D2FF", background: "rgba(0,210,255,0.1)", border: "1px solid rgba(0,210,255,0.2)", padding: "2px 8px", borderRadius: "6px" }}>
          {isSyncing ? ".." : liveDbDocuments.length} CAD STREAMS
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
        {isSyncing ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#64748B", fontSize: "11px", fontFamily: "monospace" }}>Querying server blueprint registry maps...</div>
        ) : (
          liveDbDocuments.map((doc) => {
            const isLocked = doc.isLocked;
            const isPending = !!pendingLocks[doc.id];
            const isSeed = doc.id.startsWith("seed-");

            return (
              <div
                key={doc.id}
                onClick={() => !isSeed && handleOpenDocument(doc.id)}
                style={{
                  padding: "12px",
                  background: "#090D16",
                  border: "1px solid #1E293B",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  position: "relative",
                  cursor: isSeed ? "default" : "pointer",
                  transition: "all 0.15s",
                  opacity: isSeed ? 0.6 : 1,
                }}
                className={isSeed ? "" : "hover:bg-slate-900/40"}
                title={isSeed ? "Placeholder" : `Open "${doc.title}" in FloorPlanDesigner`}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h4 style={{ fontSize: "12px", fontWeight: "600", color: "#E2E8F0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.title}
                  </h4>
                  <p style={{ fontSize: "11px", fontFamily: "monospace", color: "#64748B", margin: "4px 0 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    Level: <span style={{ fontFamily: "sans-serif", color: "#94A3B8" }}>{doc.floorName}</span>
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  {/* Lock button — separate from row click */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleLock(doc.id, e)}
                    disabled={isPending || isSeed}
                    title={
                      isSeed
                        ? "Placeholder"
                        : isLocked
                        ? `Locked by ${doc.lockedByUsername || "unknown"} — click to unlock`
                        : "Click to lock this document"
                    }
                    style={{
                      background: "transparent",
                      border: "1px solid #1E293B",
                      borderRadius: "6px",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: isPending || isSeed ? "wait" : "pointer",
                      color: isLocked ? "#FFB800" : "#64748B",
                      fontSize: "12px",
                      padding: 0,
                      transition: "all 0.15s",
                    }}
                  >
                    {isPending ? "…" : isLocked ? "🔒" : "🔓"}
                  </button>

                  {/* Module owner badge — decorative, no navigation */}
                  <span
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: "9px",
                      fontFamily: "monospace",
                      fontWeight: "bold",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "#080B14",
                      border: "1px solid #1E293B",
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      cursor: "default",
                    }}
                  >
                    {doc.moduleOwner}
                  </span>

                  {/* Arrow — decorative, part of row click */}
                  {!isSeed && (
                    <svg style={{ width: "12px", height: "12px", color: "#64748B" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
                  )}
                </div>
              </div>
            );
          })
        )}

        {!isSyncing && liveDbDocuments.length === 0 && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 0", border: "1px dashed #1E293B", borderRadius: "12px", background: "rgba(9,13,22,0.2)" }}>
            <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#64748B" }}>No telemetry files logged.</span>
          </div>
        )}
      </div>
    </div>
  );
}