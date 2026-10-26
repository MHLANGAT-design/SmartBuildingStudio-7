// src/modules/ProjectExplorer/Sidebar/ProjectTree.tsx

import React, { useEffect, useMemo } from "react";
import { useAppSelector } from "@/Application/ConfigureStore";
import { ProjectTreeItem } from "@/modules/ProjectExplorer/Sidebar/ProjectTreeItem";
import { UseExplorerTree } from "@/modules/ProjectExplorer/Hooks/UseExplorerTree";

export const ProjectTree: React.FC = () => {
  const { refreshTree, loading } = UseExplorerTree();

  const allRawNodes = useAppSelector((state: any) => {
    const slice = state?.projectExplorer || state?.ProjectExplorer;
    return slice?.nodes || [];
  });

  const searchQuery = useAppSelector((state: any) => {
    const slice = state?.projectExplorer || state?.ProjectExplorer;
    return (slice?.filters?.searchQuery || "").trim().toLowerCase();
  });

  const stableRootProjects = useMemo(() => {
    if (!Array.isArray(allRawNodes)) return [];
    return allRawNodes.filter((n: any) => {
      if (!n || n.type !== "Project" || n.parentId !== null) return false;
      if (
        searchQuery &&
        !String(n.name || "").toLowerCase().includes(searchQuery)
      ) {
        return false;
      }
      return true;
    });
  }, [allRawNodes, searchQuery]);

  // Load the tree once on mount. The server is the single source of truth.
  useEffect(() => {
    refreshTree();
  }, [refreshTree]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {loading && stableRootProjects.length === 0 ? (
          <div
            style={{
              padding: "12px",
              textAlign: "center",
              color: "#64748B",
              fontSize: "11px",
              fontFamily: "monospace",
            }}
          >
            Loading repository asset index maps...
          </div>
        ) : stableRootProjects.length === 0 ? (
          <div
            style={{
              padding: "12px",
              textAlign: "center",
              color: "#475569",
              fontSize: "11px",
              fontFamily: "monospace",
            }}
          >
            No active project entities mapped to repository.
          </div>
        ) : (
          stableRootProjects.map((projectNode) => (
            <ProjectTreeItem
              key={projectNode.id || (projectNode as any).Id}
              node={projectNode}
              depth={0}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectTree;