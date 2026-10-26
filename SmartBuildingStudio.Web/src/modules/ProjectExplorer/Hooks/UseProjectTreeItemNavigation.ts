// src/modules/ProjectExplorer/Hooks/UseProjectTreeItemNavigation.ts
//
// Dispatches full metadata before navigation. Honors the ?intent= query
// param so the Dashboard can request a specific studio directly.
//
// Two paths:
//   intent=fixtures  → route to FixturePlacementStudio
//   intent=dali      → route to DALI Designer
//   (anything else)  → select the node
//
// When a document is selected (no intent), the DocumentActionsPanel
// in ProjectExplorerPage reads the selection from the store and
// renders the four access-mode tiles inline. No modal is opened.

import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch } from "@/Application/ConfigureStore";
import { ExplorerNode } from "../Models/ExplorerNode";
import { setDocumentMetadata } from "@/modules/FloorPlanDesigner/Store/FloorPlanSlice";
import { UseProjectTreeItemContext } from "./UseProjectTreeItemContext";

export type DesignMode = "floorplans" | "import" | "fixtures" | "dali";

export function UseProjectTreeItemNavigation() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getDocumentContext } = UseProjectTreeItemContext();

  //   'fixtures'    → skip everything, go straight to FixturePlacementStudio
  //   'dali'        → skip everything, go straight to DALI Designer
  //   'floorplans'  → select the node; the panel renders
  //   null          → select the node; the panel renders
  const intent = searchParams.get("intent");

  const executeMode = useCallback(
    (documentId: string, context: any, docName: string, mode: DesignMode) => {
      // Resolve floor level.
      let resolvedFloorLevel = 0;
      if (context.level !== undefined) resolvedFloorLevel = Number(context.level);
      else if (context.floorLevel !== undefined) resolvedFloorLevel = Number(context.floorLevel);
      else if (context.floorName?.toLowerCase().includes("lvl 1")) resolvedFloorLevel = 1;
      else if (context.floorName?.toLowerCase().includes("lvl 2")) resolvedFloorLevel = 2;
      else if (context.floorName?.toLowerCase().includes("level 1")) resolvedFloorLevel = 1;
      else if (context.floorName?.toLowerCase().includes("level 2")) resolvedFloorLevel = 2;

      // Shared metadata dispatch — used by FloorPlanDesigner / FPS,
      // harmless for DALI (which reads from URL params).
      dispatch(
        setDocumentMetadata({
          id: String(documentId),
          name: docName,
          nodeType: "Document",
          nodeParentId: null,
          buildingId: context.buildingId || null,
          floorId: context.floorId || null,
          projectId: context.projectId || null,
          activeProjectName: context.projectName || "Unknown Project",
          activeBuildingName: context.buildingName || "Unknown Building",
          activeFloorName: context.floorName || "Unknown Floor",
          activeDocumentName: docName,
          level: resolvedFloorLevel,
          walls: [], doors: [], windows: [], rooms: [],
          importedDrawings: [], electricalFixtures: [],
        })
      );

      // Global context for peripheral integrations.
      (window as any).__activeDocumentId = String(documentId);
      (window as any).__designerMode = mode;
      (window as any).__activeDocumentContext = {
        ...context,
        projectId: context.projectId,
        buildingId: context.buildingId,
        floorId: context.floorId,
        projectName: context.projectName || "Unknown Project",
        buildingName: context.buildingName || "Unknown Building",
        floorName: context.floorName || "Unknown Floor",
        documentName: docName,
        level: resolvedFloorLevel,
      };

      // ── DALI Designer — dedicated route with path params. ─────────
      if (mode === "dali") {
        const projectId = context.projectId;
        if (!projectId) {
          console.warn(
            "[Navigation] DALI Designer requires a projectId in the context; refusing to navigate."
          );
          return;
        }
        navigate(`/projects/${projectId}/floorplans/${documentId}/dali`);
        return;
      }

      // ── /designer?mode=… route for FPD, FPS, Import. ──────────────
      const urlMode =
        mode === "import" ? "floorplans" :
        mode === "fixtures" ? "fixtures" :
        "floorplans";

      const params = new URLSearchParams({
        documentId: String(documentId),
        mode: urlMode,
        projectId: context.projectId || "",
        buildingId: context.buildingId || "",
        floorId: context.floorId || "",
        revision: "0",
      });

      if (mode === "import") params.set("action", "import-dwg");

      navigate(`/designer?${params.toString()}`);
    },
    [dispatch, navigate]
  );

  const handleDocumentClick = useCallback(
    (targetNode: ExplorerNode) => {
      const documentId =
        targetNode.id ??
        (targetNode as any).Id ??
        (targetNode as any).guid ??
        (targetNode as any).Guid;
      if (!documentId) return;

      const context = getDocumentContext(targetNode);
      const docName =
        targetNode.name ?? (targetNode as any).Name ?? "Untitled Document";

      // intent=fixtures → dashboard quick launch → straight to FPS.
      if (intent === "fixtures") {
        executeMode(String(documentId), context, docName, "fixtures");
        return;
      }

      // intent=dali → dashboard quick launch → straight to DALI.
      if (intent === "dali") {
        executeMode(String(documentId), context, docName, "dali");
        return;
      }

      // Default: select the node. DocumentActionsPanel reads the
      // selection from the store and renders the action tiles.
      dispatch({
        type: "projectExplorer/selectNode",
        payload: String(documentId),
      });
    },
    [getDocumentContext, intent, executeMode, dispatch]
  );

  return { handleDocumentClick, intent };
}