// src/modules/ProjectExplorer/Hooks/UseProjectTreeItemCreation.ts

import { useCallback } from "react";
import { useAppDispatch } from "@/Application/ConfigureStore";
import { API_ROUTES } from "@/Application/ApiRoutes";
import { setDocumentMetadata } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { fetchProjectExplorerTree } from "@/modules/ProjectExplorer/Store/ProjectExplorerThunks";

export function UseProjectTreeItemCreation() {
  const dispatch = useAppDispatch();

  const handleCreateDocument = useCallback(
    async (activeNodeId: string, docName: string) => {
      if (!docName || !docName.trim()) return;

      try {
        // ── Resolve hierarchy context for metadata ─────────────────────
        const state =
          (window as any).store?.getState?.() ||
          (window as any).store?.state;
        const explorerSlice =
          state?.projectExplorer || state?.ProjectExplorer || {};
        const flatNodesArray: any[] = explorerSlice?.nodes || [];

        const findNodeById = (nodes: any[], targetId: string): any => {
          if (!nodes || !Array.isArray(nodes)) return null;
          return (
            nodes.find((n) => n && String(n.id) === String(targetId)) || null
          );
        };

        let capturedProjectId = "";
        let capturedProjectName = "Unknown Project";
        let capturedBuildingId = "";
        let capturedBuildingName = "Unknown Building";
        const capturedFloorId = String(activeNodeId);
        let capturedFloorName = "Unknown Floor";

        const currentFloorNode = findNodeById(flatNodesArray, activeNodeId);
        if (currentFloorNode) {
          capturedFloorName =
            currentFloorNode.name || currentFloorNode.Name || "Unknown Floor";
          if (currentFloorNode.parentId) {
            capturedBuildingId = String(currentFloorNode.parentId);
            const bNode = findNodeById(flatNodesArray, capturedBuildingId);
            if (bNode) {
              capturedBuildingName =
                bNode.name || bNode.Name || "Unknown Building";
              if (bNode.parentId) {
                capturedProjectId = String(bNode.parentId);
                const pNode = findNodeById(flatNodesArray, capturedProjectId);
                if (pNode) {
                  capturedProjectName =
                    pNode.name || pNode.Name || "Unknown Project";
                }
              }
            }
          }
        }

        // ── POST to ProjectExplorerController.AddDocument ──────────────
        // The floor id is in the URL, so no ambiguity about the FK.
        const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.CREATE(
          capturedFloorId
        );

        const createPayload = {
          Name: docName.trim(),
          DocumentType: 1, // Floor Plan
          RoutePath: null, // server generates one
          UploadedBy: "Studio System",
          FileSizeInBytes: 0,
          DrawnWallsJson: JSON.stringify({
            walls: [],
            doors: [],
            windows: [],
          }),
          DefinedRoomsJson: JSON.stringify([]),
          PlacedFixturesJson: JSON.stringify({
            importedDrawings: [],
            electricalFixtures: [],
          }),
          PixelsToMetresScale: 1.0,
        };

        const createResponse = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(createPayload),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          throw new Error(
            `Failed to create document: ${createResponse.status} - ${errorText}`
          );
        }

        const createdDoc = await createResponse.json();
        const documentId = createdDoc.id || createdDoc.documentId;
        if (!documentId) {
          throw new Error(
            "Document was created but the server returned no id."
          );
        }

        // ── Pre-populate designer metadata so the canvas has context ───
        dispatch(
          setDocumentMetadata({
            id: String(documentId),
            name: docName.trim(),
            nodeType: "Document",
            nodeParentId: capturedFloorId,
            buildingId: capturedBuildingId || null,
            floorId: capturedFloorId || null,
            projectId: capturedProjectId || null,
            activeProjectName: capturedProjectName,
            activeBuildingName: capturedBuildingName,
            activeFloorName: capturedFloorName,
            activeDocumentName: docName.trim(),
            level: 0,
            walls: [],
            doors: [],
            windows: [],
            rooms: [],
            importedDrawings: [],
            electricalFixtures: [],
          })
        );

        // ── Refresh the tree from the server ───────────────────────────
        // The document is now actually attached to the floor in the DB,
        // so a fresh fetch will find it. No client-side injection needed.
        await dispatch(fetchProjectExplorerTree() as any);
      } catch (err: any) {
        console.error("[UseProjectTreeItemCreation] ❌ Creation failed:", err);
        alert(`Drawing Blocked: ${err.message}`);
      }
    },
    [dispatch]
  );

  return { handleCreateDocument };
}