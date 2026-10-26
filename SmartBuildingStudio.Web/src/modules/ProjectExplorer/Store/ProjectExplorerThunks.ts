import { ThunkApiConfig } from "@/Application/ConfigureStore";
import { ExplorerNode, ExplorerStatistics } from "@/modules/ProjectExplorer/Store/ProjectExplorerTypes";

type ProjectExplorerThunkAction<ReturnType = Promise<void>> = (
  dispatch: ThunkApiConfig["dispatch"],
  getState: () => ThunkApiConfig["state"],
  extra: ThunkApiConfig["extra"]
) => ReturnType;

/**
 * Queries and parses the entire hierarchical file browser tree structure.
 */
export const fetchProjectExplorerTree = (): ProjectExplorerThunkAction =>
  async (dispatch) => {
    dispatch({ type: "projectExplorer/setExplorerLoading", payload: true });
    try {
      const response = await fetch("/api/v1/project-explorer/tree", {
        method: "GET",
        headers: { "Accept": "application/json", "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error(`Server failed to compile Project tree data map.`);
      const payload: { nodes: ExplorerNode[]; statistics: ExplorerStatistics } = await response.json();
      dispatch({ type: "projectExplorer/populateExplorerTree", payload });
    } catch (err: any) {
      dispatch({ type: "projectExplorer/setExplorerError", payload: err.message || "Failed to resolve repository matrices." });
    } finally {
      dispatch({ type: "projectExplorer/setExplorerLoading", payload: false });
    }
  };

/**
 * Provisions a brand new engineering project root container inside the master database.
 */
export const createExplorerProject = (projectData: { name: string; code: string; client: string }): ProjectExplorerThunkAction =>
  async (dispatch) => {
    dispatch({ type: "projectExplorer/setExplorerLoading", payload: true });
    try {
      const response = await fetch("/api/v1/project-explorer", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          Name: projectData.name,
          Description: "Smart LED & DALI Management Workspace Layer",
          ClientName: projectData.client,
          ProjectNumber: projectData.code
        })
      });
      if (!response.ok) throw new Error("Could not initialize target project scope on remote server.");
      dispatch(fetchProjectExplorerTree());
    } catch (err: any) {
      dispatch({ type: "projectExplorer/setExplorerError", payload: err.message });
    } finally {
      dispatch({ type: "projectExplorer/setExplorerLoading", payload: false });
    }
  };

/**
 * Renames a selected item on the backend, then updates local Redux state.
 *
 * The URL depends on the node's type:
 *   Project  → PUT /api/v1/project-explorer/{id}/rename
 *   Building → PUT /api/v1/project-explorer/buildings/{id}/rename
 *   Floor    → PUT /api/v1/project-explorer/floors/{id}/rename
 *   Document → PUT /api/v1/project-explorer/documents/{id}/rename
 *
 * Vite rewrites the /api/v1/project-explorer prefix to /api/projectexplorer,
 * and the backend routes match those paths.
 *
 * Local state is updated only after the backend confirms the rename.
 */
export const renameExplorerNode = (payload: { nodeId: string; newName: string }): ProjectExplorerThunkAction =>
  async (dispatch, getState) => {
    dispatch({ type: "projectExplorer/setExplorerLoading", payload: true });

    const nodeTargetId = String(payload.nodeId);
    const configuredNewName = String(payload.newName).trim();

    if (!nodeTargetId || !configuredNewName) {
      dispatch({ type: "projectExplorer/setExplorerLoading", payload: false });
      return;
    }

    try {
      const stateRoot = getState();
      const currentNodesList =
        stateRoot.projectExplorer?.nodes ||
        (stateRoot as any).ProjectExplorer?.nodes ||
        [];

      const targetNode = currentNodesList.find(
        (n: any) => String(n.id || n.Id || "") === nodeTargetId
      );
      const nodeType = String(targetNode?.type || "Project");

      const url = (() => {
        switch (nodeType) {
          case "Building":
            return `/api/v1/project-explorer/buildings/${encodeURIComponent(nodeTargetId)}/rename`;
          case "Floor":
            return `/api/v1/project-explorer/floors/${encodeURIComponent(nodeTargetId)}/rename`;
          case "Document":
            return `/api/v1/project-explorer/documents/${encodeURIComponent(nodeTargetId)}/rename`;
          case "Project":
          default:
            return `/api/v1/project-explorer/${encodeURIComponent(nodeTargetId)}/rename`;
        }
      })();

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ NewName: configuredNewName }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `Rename failed: ${response.status} ${response.statusText}${body ? ` — ${body}` : ""}`
        );
      }

      const updatedNodesArray = currentNodesList.map((n: any) => {
        if (String(n.id || n.Id || "") === nodeTargetId) {
          return {
            ...n,
            name: configuredNewName,
            Name: configuredNewName,
          };
        }
        return n;
      });

      dispatch({
        type: "projectExplorer/populateExplorerTree",
        payload: {
          nodes: updatedNodesArray,
          statistics: stateRoot.projectExplorer?.statistics,
        },
      });
    } catch (err: any) {
      console.error("[renameExplorerNode] failed:", err);
      dispatch({
        type: "projectExplorer/setExplorerError",
        payload: err?.message || "Rename failed.",
      });
    } finally {
      dispatch({ type: "projectExplorer/setExplorerLoading", payload: false });
    }
  };

/**
 * Hard-deletes a selected item on the backend, then removes it and all its
 * descendants from local Redux state.
 *
 * The URL depends on the node's type:
 *   Project  → DELETE /api/v1/project-explorer/{id}
 *   Building → DELETE /api/v1/project-explorer/buildings/{id}
 *   Floor    → DELETE /api/v1/project-explorer/floors/{id}
 *   Document → DELETE /api/v1/project-explorer/documents/{id}
 *
 * Local state is updated only after the backend confirms the delete.
 */
export const deleteExplorerNode = (nodeId: string): ProjectExplorerThunkAction =>
  async (dispatch, getState) => {
    dispatch({ type: "projectExplorer/setExplorerLoading", payload: true });

    const targetRemoveId = String(nodeId);

    try {
      const stateRoot = getState();
      const currentNodesList =
        stateRoot.projectExplorer?.nodes ||
        (stateRoot as any).ProjectExplorer?.nodes ||
        [];

      const targetNode = currentNodesList.find(
        (n: any) => String(n.id || n.Id || "") === targetRemoveId
      );
      const nodeType = String(targetNode?.type || "Project");

      const url = (() => {
        switch (nodeType) {
          case "Building":
            return `/api/v1/project-explorer/buildings/${encodeURIComponent(targetRemoveId)}`;
          case "Floor":
            return `/api/v1/project-explorer/floors/${encodeURIComponent(targetRemoveId)}`;
          case "Document":
            return `/api/v1/project-explorer/documents/${encodeURIComponent(targetRemoveId)}`;
          case "Project":
          default:
            return `/api/v1/project-explorer/${encodeURIComponent(targetRemoveId)}`;
        }
      })();

      const response = await fetch(url, {
        method: "DELETE",
        headers: { "Accept": "application/json" },
      });

      if (!response.ok && response.status !== 404) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `Delete failed: ${response.status} ${response.statusText}${body ? ` — ${body}` : ""}`
        );
      }

      const idsToRemove = new Set<string>([targetRemoveId]);
      let checklistChanged = true;

      while (checklistChanged) {
        checklistChanged = false;
        currentNodesList.forEach((n: any) => {
          const id = String(n.id || n.Id || "");
          const parentId = String(n.parentId || n.ParentId || "");
          if (idsToRemove.has(parentId) && !idsToRemove.has(id)) {
            idsToRemove.add(id);
            checklistChanged = true;
          }
        });
      }

      const filteredNodesArray = currentNodesList.filter(
        (n: any) => !idsToRemove.has(String(n.id || n.Id || ""))
      );

      dispatch({ type: "projectExplorer/selectNode", payload: null });
      dispatch({
        type: "projectExplorer/populateExplorerTree",
        payload: {
          nodes: filteredNodesArray,
          statistics: stateRoot.projectExplorer?.statistics,
        },
      });
    } catch (err: any) {
      console.error("[deleteExplorerNode] failed:", err);
      dispatch({
        type: "projectExplorer/setExplorerError",
        payload: err?.message || "Delete failed.",
      });
    } finally {
      dispatch({ type: "projectExplorer/setExplorerLoading", payload: false });
    }
  };

/**
 * Client-side storage extraction thunk.
 * Decouples hydration from broken GET endpoints and hydrates memory cleanly.
 */
export const fetchDocumentDetailsAndOpenWorkspace = (documentId: string): ProjectExplorerThunkAction =>
  async (dispatch, getState) => {
    dispatch({ type: "projectExplorer/setExplorerLoading", payload: true });
    try {
      const stateRoot = getState();
      const currentNodesList = stateRoot.projectExplorer?.nodes || [];

      const matchedNode = currentNodesList.find((n: any) => n && String(n.id) === String(documentId));
      const globalContext = (window as any).__floorPlanActiveDocumentInstance;

      const restoredWalls = matchedNode?.walls || globalContext?.walls || [];
      const restoredDoors = matchedNode?.doors || globalContext?.doors || [];
      const restoredWindows = matchedNode?.windows || globalContext?.windows || [];
      const restoredRooms = matchedNode?.rooms || globalContext?.rooms || [];

      (window as any).__persistentDwgVectorBackupCache = [...restoredWalls];

      dispatch({
        type: "floorPlan/setDocumentMetadata",
        payload: {
          id: documentId,
          walls: restoredWalls,
          doors: restoredDoors,
          windows: restoredWindows,
          rooms: restoredRooms,
          activeProjectId: matchedNode?.parentId || globalContext?.activeProjectId,
          activeProjectName: matchedNode?.activeProjectName || globalContext?.activeProjectName || "Studio Project",
          activeBuildingName: matchedNode?.activeBuildingName || globalContext?.activeBuildingName || "Main Building",
          activeFloorName: matchedNode?.activeFloorName || globalContext?.activeFloorName || "Ground Level",
          activeDocumentName: matchedNode?.name || globalContext?.activeDocumentName
        }
      });

      dispatch({ type: "projectExplorer/selectNode", payload: documentId });
    } catch (err: any) {
      console.error("[Workspace Re-entry Hydration Error]:", err);
    } finally {
      dispatch({ type: "projectExplorer/setExplorerLoading", payload: false });
    }
  };